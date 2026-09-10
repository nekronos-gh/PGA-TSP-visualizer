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
        self.latest_heatmap: List[Dict] = []
        self.current_best_path: List[int] = []
        self.processed_files = set()
        self.output_synced = False
        self.all_files_processed = False

    def reset_state(self):
        self.solver.stop()
        self.iteration_history = []
        self.distance_history = []
        self.latest_heatmap = []
        self.current_best_path = []
        self.processed_files = set()
        self.output_synced = False
        self.all_files_processed = False
        
        # Clean output directory
        for f in glob.glob(os.path.join(settings.SOLVER_OUTPUT_DIR, "*")):
            try:
                os.remove(f)
            except:
                pass

    def start_run(self, points: List[Point], solver_type: str = "mock"):
        # Re-initialize solver if requested type differs or just re-initialize every run to be safe
        if solver_type:
            self.solver = get_solver(solver_type)

        lat_min = min(map(lambda p: p.lat, points))
        lat_max = max(map(lambda p: p.lat, points))
        lng_min = min(map(lambda p: p.lng, points))
        lng_max = max(map(lambda p: p.lng, points))

        self.kilo_scale = solver_type == "mock" or lat_max - lat_min > 60.0 or lng_max - lng_min > 120.0
        
        tsp_filepath = os.path.join(settings.TSP_INPUT_DIR, "problem.tsp")
        self._generate_tsp_file(points, tsp_filepath)
        
        self.solver.start(tsp_filepath, settings.SOLVER_OUTPUT_DIR)
        
    def _generate_tsp_file(self, points: List[Point], filepath: str):
        with open(filepath, 'w') as f:
            f.write("NAME: custom_tsp\n")
            f.write("TYPE: TSP\n")
            f.write(f"DIMENSION: {len(points)}\n")
            if self.kilo_scale:
                f.write("EDGE_WEIGHT_TYPE: GEOM_KM\n")
            else:
                f.write("EDGE_WEIGHT_TYPE: GEOM\n")
            f.write("NODE_COORD_SECTION\n")
            for i, p in enumerate(points):
                f.write(f"{i+1} {p.lat} {p.lng}\n")
            f.write("EOF\n")

    def get_state(self) -> Dict:
        status = self.solver.get_status()

        if status == "complete" and not self.output_synced:
            self.solver.sync_output(settings.SOLVER_OUTPUT_DIR)
            self.output_synced = True
            
        # Read new files
        if not self.all_files_processed:
            self._process_new_outputs()

        current_iter = 0
        current_dist = 0.0
        if self.distance_history:
            last_entry = self.distance_history[-1]
            current_iter = last_entry['iteration']
            current_dist = last_entry['distance']

        if self.all_files_processed:
            status = "processed"

        return {
            "status": status,
            "iteration_number": current_iter,
            "best_distance": current_dist,
            "best_path": self.current_best_path,
            "distance_history": self.distance_history,
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
                    
                iter_num = data.get('iteration_number')
                if iter_num is None:
                    iter_num = data.get('migration_number')
                if iter_num is None:
                    # fallback to monotonic counter if missing
                    iter_num = len(self.distance_history) + 1

                best_dist = data.get('best_distance', 0.0)
                if not self.kilo_scale:
                    best_dist = best_dist / 1000.0
                path_1based = data.get('best_path', [])
                
                self.distance_history.append({"iteration": iter_num, "distance": best_dist})
                
                self.current_best_path = [i - 1 for i in path_1based]
                
                raw_heatmap = data.get('population_heatmap', [])
                processed_heatmap = []
                if raw_heatmap and isinstance(raw_heatmap[0], (int, float)):
                    # Normalize numbers to [0, 1] range (assuming lower is better)
                    max_val = max(raw_heatmap)
                    min_val = min(raw_heatmap)
                    range_val = max_val - min_val if max_val > min_val else 1
                    
                    for idx, val in enumerate(raw_heatmap):
                        score = 1.0 - ((val - min_val) / range_val)
                        processed_heatmap.append({"solution_id": idx, "score": score})
                else:
                    processed_heatmap = raw_heatmap
                    
                self.latest_heatmap = processed_heatmap
                
                self.processed_files.add(filename)

                return # One file processed
                
            except Exception as e:
                print(f"Error reading {filename}: {e}")

        if self.output_synced:
            self.all_files_processed = True

solver_manager = SolverManager()
