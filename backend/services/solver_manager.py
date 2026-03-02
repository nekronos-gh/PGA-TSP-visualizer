import os
import glob
import json
from typing import Dict, List, Optional
from backend.solver import get_solver, BaseSolver
from backend.core.config import settings
from backend.models.api import Point

class SolverManager:
    def __init__(self):
        self.solver: BaseSolver = get_solver("mock")
        
        self.iteration_history: List[int] = []
        self.distance_history: List[Dict] = []
        self.goal_history: List[Dict] = []
        self.latest_heatmap: List[Dict] = []
        self.current_best_path: List[int] = []
        self.processed_files = set()
        
    def reset_state(self):
        self.solver.stop()
        self.iteration_history = []
        self.distance_history = []
        self.goal_history = []
        self.latest_heatmap = []
        self.current_best_path = []
        self.processed_files = set()
        
        # Clean output directory
        for f in glob.glob(os.path.join(settings.SOLVER_OUTPUT_DIR, "*")):
            try:
                os.remove(f)
            except:
                pass

    def start_run(self, points: List[Point], solver_type: str = "mock"):
        self.reset_state()
        
        # Re-initialize solver if requested type differs or just re-initialize every run to be safe
        if solver_type:
            self.solver = get_solver(solver_type)
        
        tsp_filepath = os.path.join(settings.TSP_INPUT_DIR, "problem.tsp")
        self._generate_tsp_file(points, tsp_filepath)
        
        self.solver.start(tsp_filepath, settings.SOLVER_OUTPUT_DIR)
        
    def _generate_tsp_file(self, points: List[Point], filepath: str):
        with open(filepath, 'w') as f:
            f.write("NAME: custom_tsp\n")
            f.write("TYPE: TSP\n")
            f.write(f"DIMENSION: {len(points)}\n")
            f.write("EDGE_WEIGHT_TYPE: EUC_2D\n")
            f.write("NODE_COORD_SECTION\n")
            for i, p in enumerate(points):
                f.write(f"{i+1} {p.lat} {p.lng}\n")
            f.write("EOF\n")

    def get_state(self) -> Dict:
        status = self.solver.get_status()
        
        # Sync outputs if needed
        if status in ["running", "complete"]:
            self.solver.sync_output(settings.SOLVER_OUTPUT_DIR)
            
        # Read new files
        self._process_new_outputs()

        current_iter = 0
        current_dist = 0.0
        if self.distance_history:
            last_entry = self.distance_history[-1]
            current_iter = last_entry['iteration']
            current_dist = last_entry['distance']

        return {
            "status": status,
            "iteration_number": current_iter,
            "best_distance": current_dist,
            "best_path": self.current_best_path,
            "distance_history": self.distance_history,
            "goal_history": self.goal_history,
            "population_heatmap": self.latest_heatmap
        }

    def _process_new_outputs(self):
        all_files = glob.glob(os.path.join(settings.SOLVER_OUTPUT_DIR, "iteration_*.json"))
        all_files.sort()
        
        for fpath in all_files:
            filename = os.path.basename(fpath)
            if filename in self.processed_files:
                continue
                
            try:
                with open(fpath, 'r') as f:
                    data = json.load(f)
                    
                iter_num = data.get('iteration_number', 0)
                best_dist = data.get('best_distance', 0.0)
                path_1based = data.get('best_path', [])
                
                self.distance_history.append({"iteration": iter_num, "distance": best_dist})
                self.goal_history.append({"iteration": iter_num, "goal": data.get('goal_function_value', 0.0)})
                
                self.current_best_path = [i - 1 for i in path_1based]
                self.latest_heatmap = data.get('population_heatmap', [])
                
                self.processed_files.add(filename)
                
            except Exception as e:
                print(f"Error reading {filename}: {e}")

solver_manager = SolverManager()
