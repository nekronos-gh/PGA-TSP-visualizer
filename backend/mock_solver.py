import sys
import os
import json
import time
import random
import argparse

def read_tsp(filepath):
    """Minimal TSP reader to get node count"""
    coords = []
    with open(filepath, 'r') as f:
        reading_nodes = False
        for line in f:
            line = line.strip()
            if line == "NODE_COORD_SECTION":
                reading_nodes = True
                continue
            if line == "EOF":
                break
            if reading_nodes:
                parts = line.split()
                if len(parts) >= 3:
                    coords.append((float(parts[1]), float(parts[2])))
    return coords

def generate_path(num_nodes):
    path = list(range(1, num_nodes + 1))
    random.shuffle(path)
    return path

def calculate_distance(path, coords):
    dist = 0
    for i in range(len(path)):
        u = path[i] - 1
        v = path[(i + 1) % len(path)] - 1
        x1, y1 = coords[u]
        x2, y2 = coords[v]
        dist += ((x1 - x2)**2 + (y1 - y2)**2)**0.5
    return dist

def main():
    parser = argparse.ArgumentParser(description='Mock PGA-TSP Solver')
    parser.add_argument('--input', required=True, help='Path to input .tsp file')
    parser.add_argument('--output', required=True, help='Path to output directory')
    parser.add_argument('--iterations', type=int, default=20, help='Number of iterations')
    args = parser.parse_args()

    if not os.path.exists(args.output):
        os.makedirs(args.output)

    coords = read_tsp(args.input)
    num_nodes = len(coords)
    
    best_path = generate_path(num_nodes)
    best_dist = calculate_distance(best_path, coords)
    
    # Start with a high distance
    current_best_dist = best_dist * 2
    current_best_path = generate_path(num_nodes) # Start random
    
    print(f"Starting mock solver for {num_nodes} nodes over {args.iterations} iterations")

    for i in range(1, args.iterations + 1):
        # Simulate improvement
        if i % 2 == 0:
            current_best_dist *= 0.95
            # Just shuffle a bit for visual effect
            idx1, idx2 = random.sample(range(num_nodes), 2)
            current_best_path[idx1], current_best_path[idx2] = current_best_path[idx2], current_best_path[idx1]
        
        operation = "crossover" if i % 2 == 0 else "mutation"
        
        # Fake heatmap data: list of {solution_id, score}
        heatmap = []
        for j in range(20):
            heatmap.append({
                "solution_id": j,
                "score": random.uniform(0.5, 1.0)
            })

        iteration_data = {
            "iteration_number": i,
            "best_distance": current_best_dist,
            "best_path": current_best_path,
            "operation_type": operation,
            "goal_function_value": 10000 / current_best_dist, # Inverse of distance
            "population_heatmap": heatmap
        }
        
        filename = os.path.join(args.output, f"iteration_{i:04d}.json")
        with open(filename, 'w') as f:
            json.dump(iteration_data, f)
            
        print(f"Iteration {i}/{args.iterations} complete. Best Dist: {current_best_dist:.2f}")
        time.sleep(0.5) # 500ms delay

    print("Mock solver complete")

if __name__ == "__main__":
    main()
