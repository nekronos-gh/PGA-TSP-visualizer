from .base import BaseSolver
from .vega import VegaSolver
from .local import LocalSolver
from .static import StaticSolver

def get_solver(solver_type: str) -> BaseSolver:
    if solver_type.lower() in ["vega", "hpc"]:
        return VegaSolver()
    elif solver_type.lower() in ["mock", "local"]:
        return LocalSolver()
    elif solver_type.lower() == "static":
        return StaticSolver()
    else:
        raise ValueError(f"Unknown solver type: {solver_type}")
