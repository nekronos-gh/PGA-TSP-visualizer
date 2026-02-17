import { useState, useEffect, useRef } from 'react';
import MapComponent from './components/MapComponent';
import ControlPanel from './components/ControlPanel';
import StatsPanel from './components/StatsPanel';
import axios from 'axios';

// Define types
interface Point {
    id: number;
    lat: number;
    lng: number;
}

interface StateData {
    status: string;
    iteration_number: number;
    best_distance: number;
    best_path: number[];
    distance_history: { iteration: number, distance: number }[];
    goal_history: { iteration: number, goal: number }[];
    population_heatmap: { solution_id: number, score: number }[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
    const [points, setPoints] = useState<Point[]>([]);
    const [mode, setMode] = useState<'custom' | 'preset'>('custom');
    const [status, setStatus] = useState<string>('idle');
    const [state, setState] = useState<StateData>({
        status: 'idle',
        iteration_number: 0,
        best_distance: 0,
        best_path: [],
        distance_history: [],
        goal_history: [],
        population_heatmap: []
    });

    const [polling, setPolling] = useState<boolean>(false);
    const intervalRef = useRef<number | null>(null);

    const handleMapClick = (lat: number, lng: number) => {
        if (mode === 'custom') {
            const newPoint = { id: points.length + 1, lat, lng };
            setPoints([...points, newPoint]);
        }
    };

    const handleMarkerClick = (id: number) => {
        if (mode === 'custom') {
            setPoints(points.filter(p => p.id !== id));
        }
    };

    const handleRun = async () => {
        try {
            setStatus('starting');
            await axios.post(`${API_URL}/run`, { points });
            setStatus('running');
            setPolling(true);
        } catch (error) {
            console.error('Error starting run:', error);
            setStatus('error');
        }
    };

    const handleReset = () => {
        setPoints([]);
        setMode('custom');
        setStatus('idle');
        setPolling(false);
        setState({
            status: 'idle',
            iteration_number: 0,
            best_distance: 0,
            best_path: [],
            distance_history: [],
            goal_history: [],
            population_heatmap: []
        });
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    const loadPreset = () => {
        // Berlin Coffeehouses (simplified)
        const berlinPoints = [
            { id: 1, lat: 52.5200, lng: 13.4050 },
            { id: 2, lat: 52.5100, lng: 13.3800 },
            { id: 3, lat: 52.5300, lng: 13.4200 },
            { id: 4, lat: 52.5400, lng: 13.3900 },
            { id: 5, lat: 52.5000, lng: 13.4100 },
            { id: 6, lat: 52.5250, lng: 13.3700 },
            { id: 7, lat: 52.5150, lng: 13.4300 },
        ];
        setPoints(berlinPoints);
        setMode('preset');
    };

    useEffect(() => {
        if (mode === 'preset') {
            loadPreset();
        } else if (mode === 'custom') {
            setPoints([]);
        }
    }, [mode]);

    useEffect(() => {
        if (polling) {
            intervalRef.current = window.setInterval(async () => {
                try {
                    const response = await axios.get<StateData>(`${API_URL}/state`);
                    setState(response.data);
                    setStatus(response.data.status);
                    
                    if (response.data.status === 'complete' || response.data.status === 'error') {
                        setPolling(false);
                        if (intervalRef.current) clearInterval(intervalRef.current);
                    }
                } catch (error) {
                    console.error('Error fetching state:', error);
                }
            }, 500);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [polling]);

    return (
        <div className="flex h-screen flex-col bg-gray-100">
            <header className="bg-blue-600 text-white p-4">
                <h1 className="text-2xl font-bold">PGA-TSP Visualizer</h1>
            </header>
            
            <main className="flex-grow flex p-4 gap-4 overflow-hidden">
                <div className="w-1/3 flex flex-col gap-4 overflow-y-auto">
                    <ControlPanel 
                        mode={mode} 
                        setMode={setMode} 
                        pointsCount={points.length} 
                        status={status}
                        onRun={handleRun}
                        onReset={handleReset}
                    />
                    
                    <StatsPanel 
                        iteration={state.iteration_number}
                        bestDistance={state.best_distance}
                        operationType={state.iteration_number % 2 === 0 ? "Mutation" : "Crossover"} 
                        goalValue={state.goal_history.length > 0 ? state.goal_history[state.goal_history.length - 1].goal : 0}
                        distanceHistory={state.distance_history}
                        goalHistory={state.goal_history}
                        heatmap={state.population_heatmap}
                    />
                </div>
                
                <div className="w-2/3 bg-white rounded shadow p-1 relative z-0">
                   <MapComponent 
                       points={points} 
                       onMapClick={handleMapClick} 
                       onMarkerClick={handleMarkerClick} 
                       path={state.best_path}
                       mode={mode}
                   />
                </div>
            </main>
        </div>
    );
}

export default App;
