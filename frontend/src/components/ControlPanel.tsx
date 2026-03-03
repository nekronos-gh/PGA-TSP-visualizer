import { Play, RotateCcw, Map, MousePointer, Cpu } from 'lucide-react';

interface ControlPanelProps {
    mode: 'custom' | 'preset';
    setMode: (mode: 'custom' | 'preset') => void;
    pointsCount: number;
    status: string;
    onRun: () => void;
    onReset: () => void;
    presets: string[];
    selectedPreset: string;
    onPresetChange: (preset: string) => void;
    solverType: string;
    onSolverTypeChange: (solverType: string) => void;
}

export default function ControlPanel({ 
    mode, 
    setMode, 
    pointsCount, 
    status, 
    onRun, 
    onReset,
    presets,
    selectedPreset,
    onPresetChange,
    solverType,
    onSolverTypeChange
}: ControlPanelProps) {
    const isRunning = status === 'running' || status === 'starting';

    return (
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl p-4 flex flex-col gap-4 min-w-[420px]">
            {/* Top Row: Configuration */}
            <div className="flex items-center justify-between gap-4">
                {/* Mode Switcher */}
                <div className="flex gap-1 bg-slate-900/50 p-1 rounded-full border border-slate-700/50">
                    <button 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            mode === 'custom' 
                            ? 'bg-slate-700 text-primary-400 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        onClick={() => setMode('custom')}
                        disabled={isRunning || solverType === 'static'}
                    >
                        <MousePointer size={14} />
                        MANUAL
                    </button>
                    
                    <div className={`flex items-center relative transition-all ${
                            mode === 'preset' 
                            ? 'bg-slate-700 text-primary-400 shadow-sm rounded-full pr-1' 
                            : 'text-slate-400 hover:text-slate-200 pl-2'
                        }`}>
                        <button 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap`}
                            onClick={() => setMode('preset')}
                            disabled={isRunning}
                        >
                            <Map size={14} />
                            PRESETS
                        </button>
                        
                        {mode === 'preset' && (
                            <select 
                                className="bg-slate-800 text-slate-200 text-xs py-1 px-1.5 rounded border border-slate-600 focus:outline-none focus:border-primary-500 mr-1 max-w-[100px]"
                                value={selectedPreset}
                                onChange={(e) => onPresetChange(e.target.value)}
                                disabled={isRunning}
                            >
                                {presets.map(preset => (
                                    <option 
                                        key={preset} 
                                        value={preset}
                                        disabled={solverType === 'static' && preset !== 'eu_capitals'}
                                    >
                                        {preset.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Solver Switcher */}
                <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-full border border-slate-700/50">
                    <div className="flex items-center text-slate-400 pl-2">
                        <Cpu size={14} />
                    </div>
                    <select 
                        className="bg-transparent text-slate-200 text-xs py-1.5 px-2 focus:outline-none cursor-pointer"
                        value={solverType}
                        onChange={(e) => {
                            const newType = e.target.value;
                            onSolverTypeChange(newType);
                            if (newType === 'static') {
                                setMode('preset');
                                if (presets.includes('eu_capitals')) {
                                    onPresetChange('eu_capitals');
                                }
                            }
                        }}
                        disabled={isRunning}
                    >
                        <option value="static">Static</option>
                        <option value="mock">Mock</option>
                        <option value="hpc">HPC (VEGA)</option>
                    </select>
                </div>
            </div>

            {/* Bottom Row: Actions & Status */}
            <div className="flex items-center justify-between pt-1">
                {/* Status Indicator */}
                <div className="flex items-center gap-2 px-2">
                    <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{status}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <button 
                        className="p-2 rounded-full bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
                        onClick={onReset}
                        title="Abort / Reset"
                    >
                        <RotateCcw size={16} />
                    </button>

                    <button 
                        className={`
                            flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm tracking-wide transition-all shadow-lg
                            ${pointsCount >= 3 && !isRunning
                                ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/20 scale-100' 
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                            }
                        `}
                        onClick={onRun}
                        disabled={pointsCount < 3 || isRunning}
                    >
                        <Play size={14} fill="currentColor" />
                        {isRunning ? 'OPTIMIZING...' : 'LAUNCH'}
                    </button>
                </div>
            </div>
        </div>
    );
}
