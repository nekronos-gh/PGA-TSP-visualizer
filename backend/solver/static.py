import os
import shutil
import threading
import time
from pathlib import Path

from backend.models.api import SolverParameters

from .base import BaseSolver


class StaticSolver(BaseSolver):
    def __init__(self, source_dir=None, delay=1.0):
        self.source_dir = Path(source_dir) if source_dir else (
            Path(__file__).resolve().parent.parent / "static_output"
        )
        self.delay = delay
        self.status = "idle"
        self._stop_event = threading.Event()
        self._thread = None

    def start(
        self,
        tsp_filepath: str,
        output_dir: str,
        parameters: SolverParameters | None = None,
        **kwargs,
    ) -> None:
        self.status = "starting"
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, args=(output_dir,))
        self._thread.start()

    def _run(self, output_dir: str):
        self.status = "running"
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        files = sorted(self.source_dir.glob("iteration_*.json"))

        if not files:
            self.status = "error"
            print(f"Static solver output directory is empty or missing: {self.source_dir}")
            return

        for f in files:
            if self._stop_event.is_set():
                break

            dest = output_path / f.name
            temporary_dest = dest.with_suffix(f"{dest.suffix}.tmp")
            try:
                shutil.copyfile(f, temporary_dest)
                os.replace(temporary_dest, dest)
            except Exception as e:
                if temporary_dest.exists():
                    temporary_dest.unlink()
                self.status = "error"
                print(f"Error copying {f} to {dest}: {e}")
                return
            time.sleep(self.delay)

        self.status = "complete"
        self._stop_event.set()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2.0)
        self.status = "idle"

    def get_status(self) -> str:
        return self.status

    def sync_output(self, output_dir: str) -> None:
        pass
