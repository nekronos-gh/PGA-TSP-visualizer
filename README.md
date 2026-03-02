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

To run the entire application using Docker, you must first configure the environment variables required by the backend, especially if you intend to use HPC solvers (e.g., VEGA).

### 1. Environment Configuration

Copy the provided example environment template to create your local `.env` file. This file will be automatically sourced by Docker Compose and the backend server.

```bash
cp .env.example .env
```

Edit the `.env` file to match your infrastructure credentials. **Crucially, ensure `VEGA_USER` is correctly populated**, otherwise SSH connections to the HPC login node will fail with a missing username.

```dotenv
# .env

# VEGA config
VEGA_USER=your_username            # MUST be set to your actual HPC username
VEGA_HOST=login.vega.izum.si       # HPC login node
VEGA_PORT=22                       # SSH port
VEGA_SSH_KEY=/root/.ssh/id_rsa     # Path to SSH private key mapped inside the container
VEGA_REMOTE_DIR=~/pga-tsp-workspace # Workspace directory on the remote node
```

*Note: If your SSH key is located on your host machine, ensure it is correctly volume-mapped into the backend container in your `docker-compose.yml`.*

### 2. VEGA HPC Pre-requisite

If you intend to run the solver on the VEGA cluster, you must first establish a multiplexed SSH connection with your account. This is necessary to handle Multi-Factor Authentication (MFA) and allow the backend to reuse the connection.

Run the following command on your host machine (adjusting `<your_username>` and `~/.ssh/your_ssh_key` to match your credentials):

```bash
ssh -F /dev/null \
    -i ~/.ssh/your_ssh_key \
    -o ControlMaster=yes \
    -o "ControlPath=/tmp/ssh-ctl-vega" \
    -o ControlPersist=8h \
    -Nf <your_username>@login.vega.izum.si 
```

### 3. Launching the Stack

Once the `.env` file is properly configured and the VEGA SSH connection is established (if using VEGA):

1.  Make sure you have Docker and Docker Compose installed.
2.  Run the following command in the project root:

```bash
docker-compose up --build
```

3.  Access the frontend at `http://localhost:5173`.
