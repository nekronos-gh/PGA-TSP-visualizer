from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class Point(BaseModel):
    id: int
    lat: float
    lng: float

class SolverParameters(BaseModel):
    islands: int = Field(default=32, ge=1)
    population: int = Field(default=100, ge=1)
    iterations: int = Field(default=250, ge=1)
    migrations: int = Field(default=100, ge=1)
    crossover: float = Field(default=0.15, ge=0, le=1)
    mutation: float = Field(default=0.15, ge=0, le=1)
    elitism: bool = True
    stalled_iterations: int = Field(default=50, ge=1)
    stalled_migrations: int = Field(default=20, ge=1)
    superemigration_period: int = Field(default=10, ge=1)
    gpus: int = Field(default=1, ge=1)

class RunRequest(BaseModel):
    points: List[Point]
    solver_type: Optional[str] = "mock"
    parameters: SolverParameters = Field(default_factory=SolverParameters)

class StateResponse(BaseModel):
    status: str
    iteration_number: int
    best_distance: float
    best_path: List[int]
    distance_history: List[Dict]
    population_heatmap: List[Dict]
