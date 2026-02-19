import { Play, RotateCcw, Map, MousePointer } from 'lucide-react';

interface ControlPanelProps {
    mode: 'custom' | 'preset';
    setMode: (mode: 'custom' | 'preset') => void;
    pointsCount: number;
    status: string;
    onRun: () => void;
    onReset: () => void;
}

export default function ControlPanel({ mode, setMode, pointsCount, status, onRun, onReset }: ControlPanelProps) {
    const isRunning = status === 'running' || status === 'starting';

    return (
        <div className="bg-slate-800/90 backdrop-blur-md rounded-full border border-slate-700 shadow-xl px-8 py-3 flex items-center gap-8">
            {/* Mode Switcher */}
            <div className="flex gap-2 bg-slate-900/50 p-1 rounded-full border border-slate-700/50">
                <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        mode === 'custom' 
                        ? 'bg-slate-700 text-primary-400 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    onClick={() => setMode('custom')}
                    disabled={isRunning}
                >
                    <MousePointer size={14} />
                    MANUAL
                </button>
                <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        mode === 'preset' 
                        ? 'bg-slate-700 text-primary-400 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    onClick={() => setMode('preset')}
                    disabled={isRunning}
                >
                    <Map size={14} />
                    BERLIN_SIM
                </button>
            </div>

            <div className="h-8 w-px bg-slate-700 mx-2"></div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
                <button 
                    className={`
                        flex items-center gap-2 px-6 py-2 rounded-full font-bold tracking-wide transition-all shadow-lg
                        ${pointsCount >= 3 && !isRunning
                            ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/20 scale-100' 
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                        }
                    `}
                    onClick={onRun}
                    disabled={pointsCount < 3 || isRunning}
                >
                    <Play size={16} fill="currentColor" />
                    {isRunning ? 'OPTIMIZING...' : 'LAUNCH'}
                </button>

                <button 
                    className="p-2 rounded-full bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
                    onClick={onReset}
                    title="Abort / Reset"
                >
                    <RotateCcw size={20} />
                </button>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 border-l border-slate-700 pl-6">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                <span className="text-xs font-mono text-slate-400 uppercase">{status}</span>
            </div>
        </div>
    );
}
