from abc import ABC, abstractmethod
from backend.models.api import SolverParameters

class BaseSolver(ABC):
    @abstractmethod
    def start(
        self,
        tsp_filepath: str,
        output_dir: str,
        parameters: SolverParameters | None = None,
    ) -> None:
        """Starts the solver process."""
        pass

    @abstractmethod
    def stop(self) -> None:
        """Stops the solver process if running."""
        pass

    @abstractmethod
    def get_status(self) -> str:
        """Returns the current status (running, complete, error, etc.)"""
        pass
    
    @abstractmethod
    def sync_output(self, output_dir: str) -> None:
        """Syncs the latest output files from the solver into the output_dir."""
        pass
