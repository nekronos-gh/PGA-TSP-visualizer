import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import type { ChartOptions } from 'chart.js'; // Type-only import

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Dark Mode Chart Defaults
ChartJS.defaults.color = '#94a3b8'; // Slate-400
ChartJS.defaults.borderColor = '#334155'; // Slate-700

interface StatsPanelProps {
    iteration: number;
    bestDistance: number;
    distanceHistory: { iteration: number, distance: number }[];
    goalHistory: { iteration: number, goal: number }[];
    heatmap: { solution_id: number, score: number }[];
}

export default function StatsPanel({ iteration, bestDistance, distanceHistory, goalHistory, heatmap }: StatsPanelProps) {
    const commonOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { 
                mode: 'index', 
                intersect: false,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#38bdf8',
                bodyColor: '#e2e8f0',
                borderColor: '#334155',
                borderWidth: 1
            },
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#1e293b' } } // Subtle grid
        },
        elements: {
            point: { radius: 0, hoverRadius: 4 },
            line: { tension: 0.1 }
        },
        animation: { duration: 0 }
    };

    const distData = {
        labels: distanceHistory.map(d => d.iteration),
        datasets: [{
            label: 'Distance',
            data: distanceHistory.map(d => d.distance),
            borderColor: '#38bdf8', // Primary Cyan
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            fill: true,
        }],
    };

    const goalData = {
        labels: goalHistory.map(d => d.iteration),
        datasets: [{
            label: 'Goal Score',
            data: goalHistory.map(d => d.goal),
            borderColor: '#4ade80', // Success Green
            backgroundColor: 'rgba(74, 222, 128, 0.1)',
            fill: true,
        }],
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/95 backdrop-blur-sm border-r border-slate-700 w-96 px-6 pb-6 pt-20 shadow-2xl overflow-y-auto">
            
            <div className="mb-6 flex-none">
                <h2 className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-widest">Flight Metrics</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                        <div className="text-slate-400 text-xs mb-1">BEST DISTANCE</div>
                        <div className="text-2xl font-mono text-primary-400 font-bold">{bestDistance.toFixed(1)}<span className="text-xs text-slate-500 ml-1">KM</span></div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                        <div className="text-slate-400 text-xs mb-1">ITERATION</div>
                        <div className="text-2xl font-mono text-white font-bold">{iteration}</div>
                    </div>
                </div>
            </div>

            <div className="flex-grow flex flex-col gap-4">
                <div className="flex-1 min-h-[200px] flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase">Convergence</h3>
                    <div className="flex-grow w-full bg-slate-800/20 rounded border border-slate-800 p-2 relative">
                        <Line options={commonOptions} data={distData} />
                    </div>
                </div>

                <div className="flex-1 min-h-[200px] flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase">Goal Function</h3>
                    <div className="flex-grow w-full bg-slate-800/20 rounded border border-slate-800 p-2 relative">
                        <Line options={commonOptions} data={goalData} />
                    </div>
                </div>

                <div className="flex-none">
                    <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase">Population Diversity</h3>
                    <div className="grid grid-cols-10 gap-1 bg-slate-800/50 p-2 rounded border border-slate-700">
                        {heatmap.map((cell, idx) => (
                            <div 
                                key={idx} 
                                className="w-full aspect-square rounded-[1px] transition-colors duration-300"
                                style={{ 
                                    backgroundColor: `rgba(56, 189, 248, ${Math.max(0.1, cell.score)})`, // Cyan scale
                                }}
                                title={`Sol ${cell.solution_id}: ${cell.score.toFixed(2)}`}
                            ></div>
                        ))}
                        {heatmap.length === 0 && <div className="text-xs text-slate-600 col-span-10 text-center py-2">NO DATA</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
