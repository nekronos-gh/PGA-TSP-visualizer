import { useState, useRef, useCallback } from 'react';
import MapComponent from './components/MapComponent';
import ControlPanel from './components/ControlPanel';
import StatsPanel from './components/StatsPanel';
import SolverSettings from './components/SolverSettings';
import type { SolverParameters } from './components/SolverSettings';
import axios from 'axios';
import { Activity, Lock, Settings } from 'lucide-react';

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
    population_heatmap: { solution_id: number, score: number }[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Load presets automatically from the presets folder
const presetModules = import.meta.glob('./presets/*.json', { eager: true });
const availablePresets: Record<string, Point[]> = {};

Object.entries(presetModules).forEach(([path, module]) => {
    // Extract filename as the preset name (e.g., "berlin" from "./presets/berlin.json")
    const name = path.split('/').pop()?.replace('.json', '');
    if (name) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        availablePresets[name] = (module as any).default || module;
    }
});

const INITIAL_STATE: StateData = {
    status: 'idle',
    iteration_number: 0,
    best_distance: 0,
    best_path: [],
    distance_history: [],
    population_heatmap: []
};

const DEFAULT_SOLVER_PARAMETERS: SolverParameters = {
    islands: 32,
    population: 100,
    iterations: 250,
    migrations: 100,
    crossover: 0.15,
    mutation: 0.15,
    elitism: true,
    stalled_iterations: 50,
    stalled_migrations: 20,
    superemigration_period: 10,
    gpus: 1,
};

function App() {
    const [points, setPoints] = useState<Point[]>([]);
    const [mode, setMode] = useState<'custom' | 'preset'>('custom');
    const [selectedPreset, setSelectedPreset] = useState<string>(Object.keys(availablePresets)[0] || '');
    const [status, setStatus] = useState<string>('idle');
    const [state, setState] = useState<StateData>(INITIAL_STATE);
    
    const [solverType, setSolverType] = useState<string>('mock');
    const [solverParameters, setSolverParameters] = useState<SolverParameters>(DEFAULT_SOLVER_PARAMETERS);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [controlPanelExpanded, setControlPanelExpanded] = useState(true);

    const pollingRef = useRef<boolean>(false);

    const handleMapClick = useCallback((lat: number, lng: number) => {
        if (mode !== 'custom') {
            return;
        }

        setPoints((previous) => [...previous, { id: previous.length + 1, lat, lng }]);
    }, [mode]);

    const handleMarkerClick = useCallback((id: number) => {
        if (mode === 'custom') {
            setPoints((previous) => previous.filter((point) => point.id !== id));
        }
    }, [mode]);

    const handleReset = useCallback(async () => {
        if (mode === 'custom') {
            setPoints([]);
        }
        if (pollingRef.current) {
            pollingRef.current = false;
            setStatus('stopping');
            await axios.post(`${API_URL}/stop`);
            setStatus('idle');
        }
        setState(INITIAL_STATE);
    }, [mode]);

    const loadPreset = useCallback((presetName: string) => {
        const presetPoints = availablePresets[presetName];
        if (presetPoints) {
            setPoints(presetPoints);
        }
    }, []);

    const handleModeChange = useCallback((nextMode: 'custom' | 'preset') => {
        setMode(nextMode);
        setState(INITIAL_STATE);
        setStatus('idle');
        pollingRef.current = false;

        if (nextMode === 'preset') {
            loadPreset(selectedPreset);
            return;
        }

        setPoints([]);
    }, [loadPreset, selectedPreset]);

    const handlePresetChange = useCallback((presetName: string) => {
        setSelectedPreset(presetName);
        setState(INITIAL_STATE);
        setStatus('idle');
        pollingRef.current = false;
        loadPreset(presetName);
    }, [loadPreset]);

    const fetchState = useCallback(async () => {
        const pollState = async () => {
            try {
                const response = await axios.get<StateData>(`${API_URL}/state`);
                setState(response.data);
                setStatus(response.data.status);

                if (response.data.status === 'processed' || response.data.status === 'error') {
                    pollingRef.current = false;
                    return;
                }

                if (pollingRef.current) {
                    window.setTimeout(() => {
                        void pollState();
                    }, 220);
                }
            } catch (error) {
                console.error('Error fetching state:', error);
                void handleReset();
            }
        };

        await pollState();
    }, [handleReset]);

    const handleRun = async () => {
        try {
            setControlPanelExpanded(false);
            setStatus('starting');
            try {
                await axios.get(`${API_URL}/`);
            } catch {
                console.warn('Backend not reachable, but proceeding for UI demo');
            }
            await axios.post(`${API_URL}/run`, {
                points,
                solver_type: solverType,
                parameters: solverParameters,
            });
            setStatus('running');
            pollingRef.current = true;
            void fetchState();
        } catch (error) {
            console.error('Error starting run:', error);
            setStatus('error');
        }
    };

    const isRunning = status === 'running' || status === 'starting' || status === 'pending' || status === 'stopping';

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-slate-900 text-slate-200">
            {/* Header Overlay */}
            <header className="absolute top-0 left-0 z-20 flex w-full items-center justify-between border-b border-slate-700/70 bg-slate-900/75 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4 pointer-events-none">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary-400/30 bg-primary-500/10 shadow-[0_0_24px_rgba(14,165,233,0.16)]">
                        <Activity size={17} className="text-primary-400" strokeWidth={2.5} />
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary-400 shadow-[0_0_10px_#38bdf8]" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-sm font-bold tracking-[0.18em] text-primary-300 sm:text-base">DRONE LOGISTICS</h1>
                        <p className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500 sm:block">Route optimization console</p>
                    </div>
                </div>
                <div className="relative pointer-events-auto">
                    <button
                        type="button"
                        onClick={() => setSettingsOpen(!settingsOpen)}
                        disabled={isRunning}
                        title={isRunning ? 'Settings locked while running' : 'Solver settings'}
                        aria-label={isRunning ? 'Settings locked while running' : 'Open solver settings'}
                        className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/70 text-slate-300 shadow-lg shadow-slate-950/10 transition-[border-color,background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary-400/70 hover:bg-primary-500/10 hover:text-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                        {isRunning ? <Lock size={20} /> : <Settings size={20} />}
                    </button>
                    {settingsOpen && (
                        <SolverSettings
                            parameters={solverParameters}
                            onChange={setSolverParameters}
                            onClose={() => setSettingsOpen(false)}
                            disabled={isRunning}
                        />
                    )}
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
                        heatmap={state.population_heatmap}
                    />
                </div>

                {/* Right Area Overlaying Map */}
                <div className="relative flex-grow h-full">
                    {/* Control Panel (Bottom Center of Map Area) */}
                    <div className="absolute bottom-4 left-3 right-3 pointer-events-auto sm:bottom-8 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
                        <ControlPanel 
                            mode={mode} 
                            setMode={handleModeChange} 
                            pointsCount={points.length} 
                            status={status}
                            onRun={handleRun}
                            onReset={handleReset}
                            presets={Object.keys(availablePresets)}
                            selectedPreset={selectedPreset}
                            onPresetChange={handlePresetChange}
                            solverType={solverType}
                            onSolverTypeChange={setSolverType}
                            isExpanded={controlPanelExpanded}
                            onToggle={() => setControlPanelExpanded((expanded) => !expanded)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
