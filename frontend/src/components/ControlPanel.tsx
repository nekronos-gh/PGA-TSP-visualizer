import {
  Play,
  RotateCcw,
  Map,
  MousePointer,
  Cpu,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ControlPanelProps {
  mode: "custom" | "preset";
  setMode: (mode: "custom" | "preset") => void;
  pointsCount: number;
  status: string;
  onRun: () => void;
  onReset: () => void;
  presets: string[];
  selectedPreset: string;
  onPresetChange: (preset: string) => void;
  solverType: string;
  onSolverTypeChange: (solverType: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
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
  onSolverTypeChange,
  isExpanded,
  onToggle,
}: ControlPanelProps) {
  const isRunning =
    status === "running" ||
    status === "starting" ||
    status === "pending" ||
    status === "stopping";

  return (
    <div className="flex w-full flex-col items-center">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Hide mission control" : "Show mission control"}
        title={isExpanded ? "Hide mission control" : "Show mission control"}
        className={`pointer-events-auto z-10 flex h-7 items-center justify-center border border-slate-600/70 bg-slate-800/95 text-slate-400 transition-[background-color,color] duration-200 hover:bg-slate-700 hover:text-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70 ${
          isExpanded
            ? "w-24 rounded-t-xl border-b-0"
            : "min-w-24 rounded-full px-4"
        }`}
      >
        {isExpanded ? (
          <ChevronDown size={24} strokeWidth={3} />
        ) : (
          <ChevronUp size={24} strokeWidth={3} />
        )}
      </button>
      <div
        className={`w-full overflow-hidden transition-all duration-300 ease-out ${
          isExpanded
            ? "max-h-[500px] translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 translate-y-4 opacity-0"
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="w-full min-w-0 rounded-2xl border border-slate-600/70 bg-slate-800/90 p-3 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:min-w-[580px] sm:p-4">
          <div className="mb-3 flex items-center justify-between border-b border-slate-700/70 pb-3">
            <div>
              <p className="text-base font-semibold uppercase tracking-[0.2em] text-slate-500">
                Mission control
              </p>
            </div>
            <div
              className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                isRunning
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-slate-600/80 bg-slate-900/40 text-slate-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isRunning ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`}
              />
              {isRunning ? "Live" : "Ready"}
            </div>
          </div>
          {/* Top Row: Configuration */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Mode Switcher */}
        <div className="flex w-full gap-1 rounded-xl border border-slate-700/70 bg-slate-950/30 p-1 sm:w-auto">
          <button
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 sm:flex-none ${
              mode === "custom"
                ? "bg-slate-700/90 text-primary-300 shadow-sm shadow-slate-950/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => setMode("custom")}
            disabled={isRunning || solverType === "static"}
          >
            <MousePointer size={14} />
            MANUAL
          </button>

          <div
            className={`relative flex flex-1 items-center transition-all sm:flex-none ${
              mode === "preset"
                ? "rounded-lg bg-slate-700/90 pr-1 text-primary-300 shadow-sm shadow-slate-950/20"
                : "pl-2 text-slate-400 hover:text-slate-200"
            }`}
          >
            <button
              className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium"
              onClick={() => setMode("preset")}
              disabled={isRunning}
            >
              <Map size={14} />
              PRESETS
            </button>

            {mode === "preset" && (
              <select
                className="mr-1 max-w-[100px] rounded border border-slate-600 bg-slate-800 px-1.5 py-1 text-xs text-slate-200 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50"
                value={selectedPreset}
                onChange={(e) => onPresetChange(e.target.value)}
                disabled={isRunning}
              >
                {presets.map((preset) => (
                  <option
                    key={preset}
                    value={preset}
                    disabled={
                      solverType === "static" && preset !== "eu_capitals"
                    }
                  >
                    {preset.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Solver Switcher */}
        <label className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/30 p-1">
          <div className="flex items-center pl-2 text-slate-400">
            <Cpu size={14} />
          </div>
          <select
            className="cursor-pointer appearance-none bg-transparent py-2 pl-1 pr-7 text-xs text-slate-200 outline-none focus-visible:text-primary-300"
            value={solverType}
            onChange={(e) => {
              const newType = e.target.value;
              onSolverTypeChange(newType);
              if (newType === "static") {
                setMode("preset");
                if (presets.includes("eu_capitals")) {
                  onPresetChange("eu_capitals");
                }
              }
            }}
            disabled={isRunning}
          >
            <option value="static">Static</option>
            <option value="mock">Mock</option>
            <option value="hpc">HPC (VEGA)</option>
          </select>
          <ChevronDown
            size={14}
            className="-ml-7 pointer-events-none text-slate-500"
          />
        </label>
          </div>

          {/* Bottom Row: Actions & Status */}
          <div className="flex items-center justify-between gap-3 pt-3">
        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-2">
          <div
            className={`h-2 w-2 rounded-full ${isRunning ? "animate-pulse bg-emerald-400 shadow-[0_0_8px_#4ade80]" : "bg-slate-500"}`}
          />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            {status}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-700/70 text-slate-400 transition-[border-color,background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-red-400/40 hover:bg-red-500/15 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
            onClick={onReset}
            title="Abort / Reset"
          >
            <RotateCcw size={16} />
          </button>

          <button
            className={`
                            flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold tracking-wide shadow-lg transition-[background-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800
                            ${
                              pointsCount >= 3 && !isRunning
                                ? "bg-primary-600 text-white shadow-primary-500/25 hover:-translate-y-0.5 hover:bg-primary-500 hover:shadow-primary-500/35"
                                : "cursor-not-allowed bg-slate-700 text-slate-500 opacity-50"
                            }
                        `}
            onClick={onRun}
            disabled={pointsCount < 3 || isRunning}
          >
            <Play size={14} fill="currentColor" />
            {isRunning ? "OPTIMIZING..." : "LAUNCH"}
          </button>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
