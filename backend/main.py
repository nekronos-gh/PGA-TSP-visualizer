import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.models.api import RunRequest
from backend.services.solver_manager import solver_manager

# Ensure directories exist
os.makedirs(settings.SOLVER_OUTPUT_DIR, exist_ok=True)
os.makedirs(settings.TSP_INPUT_DIR, exist_ok=True)

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def run_solver_background(request: RunRequest):
    solver_manager.start_run(request.points, solver_type=request.solver_type)

@app.post("/run")
async def start_run(request: RunRequest, background_tasks: BackgroundTasks):
    if len(request.points) < 3:
        raise HTTPException(status_code=400, detail="At least 3 points required")
    background_tasks.add_task(run_solver_background, request)
    return {"message": "Solver started"}

@app.get("/state")
async def get_state():
    return solver_manager.get_state()
