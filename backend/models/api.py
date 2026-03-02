from typing import List, Dict, Optional
from pydantic import BaseModel

class Point(BaseModel):
    id: int
    lat: float
    lng: float

class RunRequest(BaseModel):
    points: List[Point]
    solver_type: Optional[str] = "mock"

class StateResponse(BaseModel):
    status: str
    iteration_number: int
    best_distance: float
    best_path: List[int]
    distance_history: List[Dict]
    goal_history: List[Dict]
    population_heatmap: List[Dict]
