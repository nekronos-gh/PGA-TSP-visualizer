import os
import glob
import time
import shutil
import threading
from .base import BaseSolver

class StaticSolver(BaseSolver):
    def __init__(self, source_dir="backend/static_output", delay=1.0):
        self.source_dir = source_dir
        self.delay = delay
        self.status = "idle"
        self._stop_event = threading.Event()
        self._thread = None

    def start(self, tsp_filepath: str, output_dir: str, **kwargs) -> None:
        self.status = "starting"
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, args=(output_dir,))
        self._thread.start()

    def _run(self, output_dir: str):
        self.status = "running"
        files = sorted(glob.glob(os.path.join(self.source_dir, "iteration_*.json")))
        
        for f in files:
            if self._stop_event.is_set():
                break
            
            dest = os.path.join(output_dir, os.path.basename(f))
            try:
                shutil.copy(f, dest)
            except Exception as e:
                print(f"Error copying {f}: {e}")
            time.sleep(self.delay)
            
        if not self._stop_event.is_set():
            self.status = "complete"

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2.0)
        self.status = "idle"

    def get_status(self) -> str:
        return self.status
        
    def sync_output(self, output_dir: str) -> None:
        pass
