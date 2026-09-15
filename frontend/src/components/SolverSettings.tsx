import { Lock, Settings, X } from 'lucide-react';

export interface SolverParameters {
    islands: number;
    population: number;
    iterations: number;
    migrations: number;
    crossover: number;
    mutation: number;
    elitism: boolean;
    stalled_iterations: number;
    stalled_migrations: number;
    superemigration_period: number;
    gpus: number;
}

interface SolverSettingsProps {
    parameters: SolverParameters;
    onChange: (parameters: SolverParameters) => void;
    onClose: () => void;
    disabled: boolean;
}

const numericFields: Array<{
    key: Exclude<keyof SolverParameters, 'elitism'>;
    label: string;
    step?: number;
    min?: number;
}> = [
    { key: 'islands', label: 'Islands', min: 1 },
    { key: 'population', label: 'Population', min: 1 },
    { key: 'iterations', label: 'Iterations', min: 1 },
    { key: 'migrations', label: 'Migrations', min: 1 },
    { key: 'crossover', label: 'Crossover probability', step: 0.01, min: 0 },
    { key: 'mutation', label: 'Mutation probability', step: 0.01, min: 0 },
    { key: 'stalled_iterations', label: 'Stalled iterations', min: 1 },
    { key: 'stalled_migrations', label: 'Stalled migrations', min: 1 },
    { key: 'superemigration_period', label: 'Superemigration period', min: 1 },
    { key: 'gpus', label: 'GPUs', min: 1 },
];

export default function SolverSettings({ parameters, onChange, onClose, disabled }: SolverSettingsProps) {
    const updateNumber = (key: Exclude<keyof SolverParameters, 'elitism'>, value: string) => {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
            onChange({ ...parameters, [key]: parsed });
        }
    };

    return (
        <div className="absolute right-0 top-12 z-30 max-h-[calc(100vh-6rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-600/80 bg-slate-900/95 p-4 text-left shadow-2xl shadow-slate-950/50 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-700/70 pb-3">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Settings size={16} className="text-primary-400" />
                    SOLVER CONFIGURATION
                    </div>
                    <p className="mt-1 pl-6 text-[10px] uppercase tracking-wider text-slate-500">Tune the search strategy</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70"
                    aria-label="Close solver configuration"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {numericFields.map(({ key, label, step, min }) => (
                    <label key={key} className="flex min-w-0 flex-col gap-1.5 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">
                        {label}
                        <input
                            type="number"
                            min={min}
                            step={step ?? 1}
                            value={parameters[key]}
                            onChange={(event) => updateNumber(key, event.target.value)}
                            disabled={disabled}
                            className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-2 text-sm normal-case tracking-normal text-slate-100 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </label>
                ))}
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                    type="checkbox"
                    checked={parameters.elitism}
                    onChange={(event) => onChange({ ...parameters, elitism: event.target.checked })}
                    disabled={disabled}
                    className="h-4 w-4 accent-primary-500"
                />
                Enable elitism
            </label>

            {disabled && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                    <Lock size={13} />
                    Settings are locked while the solver is running.
                </div>
            )}
        </div>
    );
}
