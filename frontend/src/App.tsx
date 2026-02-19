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
            // Check if server is reachable first
            try {
                await axios.get(`${API_URL}/`);
            } catch (e) {
               console.warn("Backend not reachable, but proceeding for UI demo");
            }
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
        <div className="relative h-screen w-screen overflow-hidden bg-slate-900 text-slate-200">
            {/* Header Overlay */}
            <header className="absolute top-0 left-0 w-full z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 px-6 py-4 flex justify-between items-center pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse shadow-[0_0_10px_#0ea5e9]"></div>
                    <h1 className="text-xl font-mono tracking-widest text-primary-400 font-bold">DRONE LOGISTICS</h1>
                </div>
                <div className="text-xs font-mono text-slate-500">
                    SYS.STATUS: {status.toUpperCase()}
                </div>
            </header>
            
            {/* Fullscreen Map Layer */}
            <div className="absolute inset-0 z-0">
               <MapComponent 
                   points={points} 
                   onMapClick={handleMapClick} 
                   onMarkerClick={handleMarkerClick} 
                   path={state.best_path}
                   mode={mode}
               />
            </div>

            {/* Floating Dashboard Layer */}
            <div className="absolute inset-0 z-10 pointer-events-none flex">
                {/* Stats Panel (Left Sidebar) */}
                <div className="h-full pointer-events-auto flex-none">
                    <StatsPanel 
                        iteration={state.iteration_number}
                        bestDistance={state.best_distance}
                        distanceHistory={state.distance_history}
                        goalHistory={state.goal_history}
                        heatmap={state.population_heatmap}
                    />
                </div>

                {/* Right Area Overlaying Map */}
                <div className="relative flex-grow h-full">
                    {/* Control Panel (Bottom Center of Map Area) */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
                        <ControlPanel 
                            mode={mode} 
                            setMode={setMode} 
                            pointsCount={points.length} 
                            status={status}
                            onRun={handleRun}
                            onReset={handleReset}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
