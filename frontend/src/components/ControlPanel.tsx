interface ControlPanelProps {
    mode: 'custom' | 'preset';
    setMode: (mode: 'custom' | 'preset') => void;
    pointsCount: number;
    status: string;
    onRun: () => void;
    onReset: () => void;
}

export default function ControlPanel({ mode, setMode, pointsCount, status, onRun, onReset }: ControlPanelProps) {
    return (
        <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-xl font-bold mb-4">Controls</h2>
            <div className="flex gap-4 mb-4">
                <button 
                    className={`px-4 py-2 rounded ${mode === 'custom' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                    onClick={() => setMode('custom')}
                >
                    Custom
                </button>
                <button 
                    className={`px-4 py-2 rounded ${mode === 'preset' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                    onClick={() => setMode('preset')}
                >
                    Preset (Berlin)
                </button>
            </div>
            
            <div className="mb-4">
                <p>Points: {pointsCount}</p>
                <p>Status: {status}</p>
            </div>

            <div className="flex gap-4">
                <button 
                    className={`px-4 py-2 rounded text-white ${pointsCount >= 3 ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'}`}
                    onClick={onRun}
                    disabled={pointsCount < 3 || status === 'running'}
                >
                    RUN
                </button>
                <button 
                    className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                    onClick={onReset}
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
