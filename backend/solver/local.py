import subprocess
from .base import BaseSolver

class LocalSolver(BaseSolver):
    def __init__(self, executable="python3 backend/solver/mock_solver.py"):
        self.executable = executable
        self.process = None
        self.status = "idle"

    def start(self, tsp_filepath: str, output_dir: str) -> None:
        cmd = self.executable.split() + ["--input", tsp_filepath, "--output", output_dir]
        try:
            self.process = subprocess.Popen(cmd)
            self.status = "running"
        except Exception as e:
            print(f"Error starting local solver: {e}")
            self.status = "error"

    def stop(self) -> None:
        if self.process and self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=2)
            except:
                self.process.kill()
        self.status = "complete"

    def get_status(self) -> str:
        if self.process:
            ret_code = self.process.poll()
            if ret_code is not None:
                if self.status == "running":
                    self.status = "complete"
                self.process = None
        elif self.status == "running":
            self.status = "complete"
        return self.status
        
    def sync_output(self, output_dir: str) -> None:
        # Local solver directly writes to the directory, so no sync needed
        pass
