import os
import subprocess
import glob
import json
import time
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SOLVER_PATH = os.getenv("SOLVER_PATH", "python3 backend/mock_solver.py")
SOLVER_OUTPUT_DIR = "solver_output"
TSP_INPUT_DIR = "tsp_input"

# Ensure directories exist
os.makedirs(SOLVER_OUTPUT_DIR, exist_ok=True)
os.makedirs(TSP_INPUT_DIR, exist_ok=True)

# Global state
current_process: Optional[subprocess.Popen] = None
iteration_history: List[int] = []
distance_history: List[Dict] = []
goal_history: List[Dict] = []
latest_heatmap: List[Dict] = []
current_best_path: List[int] = []
current_status = "idle" # idle, running, complete, error
processed_files = set()

class Point(BaseModel):
    id: int
    lat: float
    lng: float

class RunRequest(BaseModel):
    points: List[Point]

class StateResponse(BaseModel):
    status: str
    iteration_number: int
    best_distance: float
    best_path: List[int]
    distance_history: List[dict]
    goal_history: List[dict]
    population_heatmap: List[dict]

def run_solver_background(tsp_filepath: str):
    global current_process, current_status
    
    # Wait for process to start
    time.sleep(0.5)
    
    cmd = SOLVER_PATH.split() + ["--input", tsp_filepath, "--output", SOLVER_OUTPUT_DIR]
    print(f"Executing: {' '.join(cmd)}")
    
    try:
        current_process = subprocess.Popen(cmd)
        current_status = "running"
    except Exception as e:
        print(f"Error starting solver: {e}")
        current_status = "error"

def generate_tsp_file(points: List[Point], filepath: str):
    with open(filepath, 'w') as f:
        f.write("NAME: custom_tsp\n")
        f.write("TYPE: TSP\n")
        f.write(f"DIMENSION: {len(points)}\n")
        f.write("EDGE_WEIGHT_TYPE: EUC_2D\n")
        f.write("NODE_COORD_SECTION\n")
        for i, p in enumerate(points):
            # TSP format usually uses 1-based indexing for node IDs
            f.write(f"{i+1} {p.lat} {p.lng}\n")
        f.write("EOF\n")

@app.post("/run")
async def start_run(request: RunRequest, background_tasks: BackgroundTasks):
    global current_process, iteration_history, distance_history, goal_history, latest_heatmap, current_status, processed_files, current_best_path
    
    if len(request.points) < 3:
        raise HTTPException(status_code=400, detail="At least 3 points required")

    # Reset state
    if current_process and current_process.poll() is None:
        current_process.terminate()
        try:
            current_process.wait(timeout=2)
        except:
            current_process.kill()

    # Clean output directory
    for f in glob.glob(os.path.join(SOLVER_OUTPUT_DIR, "*")):
        try:
            os.remove(f)
        except:
            pass

    iteration_history = []
    distance_history = []
    goal_history = []
    latest_heatmap = []
    current_best_path = []
    processed_files = set()
    current_status = "pending"

    tsp_filepath = os.path.join(TSP_INPUT_DIR, "problem.tsp")
    generate_tsp_file(request.points, tsp_filepath)
    
    background_tasks.add_task(run_solver_background, tsp_filepath)
    
    return {"message": "Solver started"}

@app.get("/state") # , response_model=StateResponse
async def get_state():
    global current_status, iteration_history, distance_history, goal_history, latest_heatmap, current_process, processed_files, current_best_path

    # Check process status
    if current_process:
        ret_code = current_process.poll()
        if ret_code is not None:
            if current_status == "running":
                current_status = "complete"
            current_process = None
    elif current_status == "running":
         # Should not happen unless process vanished
         current_status = "complete"

    # Read new files
    all_files = glob.glob(os.path.join(SOLVER_OUTPUT_DIR, "iteration_*.json"))
    all_files.sort()
    
    updated = False
    
    for fpath in all_files:
        filename = os.path.basename(fpath)
        if filename in processed_files:
            continue
            
        try:
            with open(fpath, 'r') as f:
                data = json.load(f)
                
            iter_num = data.get('iteration_number', 0)
            best_dist = data.get('best_distance', 0.0)
            path_1based = data.get('best_path', [])
            
            # Update history
            distance_history.append({"iteration": iter_num, "distance": best_dist})
            goal_history.append({"iteration": iter_num, "goal": data.get('goal_function_value', 0.0)})
            
            # Update latest state
            current_best_path = [i - 1 for i in path_1based]
            latest_heatmap = data.get('population_heatmap', [])
            
            processed_files.add(filename)
            updated = True
            
        except Exception as e:
            print(f"Error reading {filename}: {e}")

    # Determine current iteration number
    current_iter = 0
    current_dist = 0.0
    if distance_history:
        last_entry = distance_history[-1]
        current_iter = last_entry['iteration']
        current_dist = last_entry['distance']

    return {
        "status": current_status,
        "iteration_number": current_iter,
        "best_distance": current_dist,
        "best_path": current_best_path,
        "distance_history": distance_history,
        "goal_history": goal_history,
        "population_heatmap": latest_heatmap
    }
