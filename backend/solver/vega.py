import os
import subprocess
import time

from backend.core.config import settings
from backend.models.api import SolverParameters

from .base import BaseSolver


class VegaSolver(BaseSolver):
    def __init__(self):
        self.host = settings.VEGA_HOST
        self.port = settings.VEGA_PORT
        self.user = settings.VEGA_USER
        self.ssh_key = settings.VEGA_SSH_KEY
        self.remote_dir = settings.VEGA_REMOTE_DIR  # ← no trailing comma
        self.job_template_path = (
            "backend/templates/vega-tsp-job.sh"  # ← no trailing comma
        )
        self.cluster_name = "VEGA"
        self.control_path = (
            "/tmp/ssh-ctl-vega"  # pre-established on host, mounted into container
        )

        self.status = "idle"
        self.job_id = None
        self.remote_work_dir = None

    def _base_ssh_opts(self) -> list:
        return [
            "-F",
            "/dev/null",
            "-i",
            os.path.expanduser(self.ssh_key),
            "-p",
            str(self.port),
            "-o",
            "StrictHostKeyChecking=no",
            "-o",
            f"ControlPath={self.control_path}",
            "-o",
            "ControlMaster=auto",
            "-o",
            "ControlPersist=2h",
        ]

    def _base_scp_opts(self) -> list:
        return [
            "-F",
            "/dev/null",
            "-i",
            os.path.expanduser(self.ssh_key),
            "-P",
            str(self.port),
            "-o",
            "StrictHostKeyChecking=no",
            "-o",
            f"ControlPath={self.control_path}",
            "-o",
            "ControlMaster=auto",
            "-o",
            "ControlPersist=2h",
        ]

    def _check_master(self):
        result = subprocess.run(
            [
                "ssh",
                "-F",
                "/dev/null",
                "-o",
                f"ControlPath={self.control_path}",
                "-O",
                "check",
                f"{self.user}@{self.host}",
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise Exception(
                "No active SSH master connection found. "
                "Run on host: ssh -F /dev/null -i ~/.ssh/vega_access "
                f"-o ControlMaster=yes -o 'ControlPath={self.control_path}' "
                f"-o ControlPersist=8h -Nf {self.user}@{self.host}"
            )

    def _run_ssh(self, command: str) -> str:
        ssh_cmd = ["ssh", *self._base_ssh_opts(), f"{self.user}@{self.host}", command]
        print(f"Executing SSH: {' '.join(ssh_cmd)}")
        result = subprocess.run(ssh_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(result.stderr)
            raise Exception(f"SSH command failed: {result.stderr}")
        return result.stdout.strip()

    def _run_scp_to_remote(self, local_path: str, remote_path: str):
        scp_cmd = [
            "scp",
            *self._base_scp_opts(),
            local_path,
            f"{self.user}@{self.host}:{remote_path}",
        ]
        print(f"Executing SCP: {' '.join(scp_cmd)}")
        result = subprocess.run(scp_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"SCP transfer failed: {result.stderr}")

    def _run_rsync_from_remote(self, remote_path: str, local_path: str):
        ssh_opts_str = " ".join(self._base_ssh_opts())
        rsync_cmd = [
            "rsync",
            "-e",
            f"ssh {ssh_opts_str}",
            "-r",
            f"{self.user}@{self.host}:{remote_path}",
            local_path,
        ]
        result = subprocess.run(rsync_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"rsync Warning/Error: {result.stderr}")

    def start(
        self,
        tsp_filepath: str,
        output_dir: str,
        parameters: SolverParameters | None = None,
    ) -> None:
        self.status = "starting"
        try:
            if parameters is None:
                parameters = SolverParameters()
            self._check_master()  # fail fast with a clear message if socket is missing

            remote_work_dir = f"{self.remote_dir}/run_{int(time.time())}"
            self.remote_work_dir = remote_work_dir
            self._run_ssh(f"mkdir -p {remote_work_dir}/history")

            batch_script_path = os.path.join(output_dir, "submit_job.sh")
            self._create_job_script(
                batch_script_path,
                os.path.basename(tsp_filepath),
                parameters,
            )

            self._run_scp_to_remote(tsp_filepath, f"{remote_work_dir}/")
            self._run_scp_to_remote(batch_script_path, f"{remote_work_dir}/")

            submit_output = self._run_ssh(
                f"cd {remote_work_dir} && sbatch submit_job.sh"
            )
            if "Submitted batch job" in submit_output:
                self.job_id = submit_output.split()[-1]
                print(f"Job submitted to {self.cluster_name} with ID: {self.job_id}")
            else:
                print(f"Unexpected sbatch output: {submit_output}")
                self.job_id = "unknown"

            self.status = "pending"

            while self.status in ["pending", "running"]:
                self._run_rsync_from_remote(
                    f"{self.remote_work_dir}/history/", f"{output_dir}/"
                )
                time.sleep(0.5)

        except Exception as e:
            print(f"Failed to start {self.cluster_name} job: {e}")
            self.status = "error"

    def _create_job_script(
        self,
        dest_path: str,
        tsp_filename: str,
        parameters: SolverParameters,
    ):
        try:
            with open(self.job_template_path, "r") as f:
                job_template = f.read()
        except FileNotFoundError:
            raise Exception(f"Job template not found at {self.job_template_path}")

        replacements = {
            "PLACEHOLDER.tsp": tsp_filename,
            "PLACEHOLDER.gpus": str(parameters.gpus),
            "PLACEHOLDER.islands": str(parameters.islands),
            "PLACEHOLDER.population": str(parameters.population),
            "PLACEHOLDER.iterations": str(parameters.iterations),
            "PLACEHOLDER.migrations": str(parameters.migrations),
            "PLACEHOLDER.superemigration_period": str(
                parameters.superemigration_period
            ),
            "PLACEHOLDER.stalled_iterations": str(parameters.stalled_iterations),
            "PLACEHOLDER.stalled_migrations": str(parameters.stalled_migrations),
            "PLACEHOLDER.crossover": str(parameters.crossover),
            "PLACEHOLDER.mutation": str(parameters.mutation),
            "PLACEHOLDER.elitism": "--elitism" if parameters.elitism else "",
        }
        for placeholder, value in replacements.items():
            job_template = job_template.replace(placeholder, value)
        with open(dest_path, "w") as f:
            f.write(job_template)

    def stop(self) -> None:
        if self.job_id:
            try:
                self._run_ssh(f"scancel {self.job_id}")
            except Exception as e:
                print(f"Failed to cancel job: {e}")
        self.status = "idle"

    def get_status(self) -> str:
        if (self.status == "running" or self.status == "pending") and self.job_id:
            try:
                out = self._run_ssh(f"squeue -j {self.job_id} -h -o %T")
                if not out:
                    self.status = "complete"
                elif out == "RUNNING":
                    self.status = "running"
            except Exception:
                pass
        return self.status

    def sync_output(self, output_dir: str) -> None:
        if self.remote_work_dir:
            try:
                self._run_rsync_from_remote(
                    f"{self.remote_work_dir}/history/", f"{output_dir}/"
                )
            except Exception:
                pass
