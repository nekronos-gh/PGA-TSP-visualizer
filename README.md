# PGA-TSP Visualizer

A minimal web GUI for defining TSP problems, running a solver, and visualizing the optimization process live.

## Features
- Interactive Map (Leaflet) to define points.
- Local execution of PGA-TSP solver.
- Live visualization of:
    - Best path on map.
    - Distance and Goal function charts.
    - Population heatmap.

## Setup & Running

### 1. Backend
The backend handles TSP file generation and solver execution.

```bash
# Navigate to project root
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the server (from project root)
cd ..
uvicorn backend.main:app --reload --port 8000
```
The backend will run on `http://localhost:8000`.

### 2. Frontend
The frontend is a React application.

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
The frontend will run on `http://localhost:5173`.

### 3. Usage
1. Open the frontend URL.
2. Select "Custom" mode to add points by clicking on the map, or select "Preset" to load Berlin locations.
3. Once you have at least 3 points, click "RUN".
4. Watch the solver progress live!

## Docker Execution

To run the entire application using Docker:

1.  Make sure you have Docker and Docker Compose installed.
2.  Run the following command in the project root:

```bash
docker-compose up --build
```

3.  Access the frontend at `http://localhost:5173`.
