import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface StatsPanelProps {
    iteration: number;
    bestDistance: number;
    operationType: string;
    goalValue: number;
    distanceHistory: { iteration: number, distance: number }[];
    goalHistory: { iteration: number, goal: number }[];
    heatmap: { solution_id: number, score: number }[];
}

export default function StatsPanel({ iteration, bestDistance, operationType, goalValue, distanceHistory, goalHistory, heatmap }: StatsPanelProps) {
    const distData = {
        labels: distanceHistory.map(d => d.iteration),
        datasets: [
            {
                label: 'Best Distance',
                data: distanceHistory.map(d => d.distance),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
        ],
    };

    const goalData = {
        labels: goalHistory.map(d => d.iteration),
        datasets: [
            {
                label: 'Goal Function',
                data: goalHistory.map(d => d.goal),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: false,
            },
        },
        animation: {
            duration: 0 
        }
    };

    return (
        <div className="bg-white p-4 rounded shadow grid grid-cols-2 gap-4 h-full">
            <div>
                <h3 className="text-lg font-bold mb-2">Metrics</h3>
                <p>Iteration: {iteration}</p>
                <p>Best Dist: {bestDistance.toFixed(2)}</p>
                <p>Goal Val: {goalValue.toFixed(4)}</p>
                <p>Op: {operationType}</p>
                
                <h3 className="text-lg font-bold mt-4 mb-2">Heatmap</h3>
                <div className="grid grid-cols-5 gap-1 w-full max-w-xs">
                    {heatmap.map((cell, idx) => (
                        <div 
                            key={idx} 
                            className="w-8 h-8 rounded"
                            style={{ 
                                backgroundColor: `rgba(0, 128, 0, ${cell.score})`,
                                border: '1px solid #ccc'
                            }}
                            title={`Sol ${cell.solution_id}: ${cell.score.toFixed(2)}`}
                        ></div>
                    ))}
                </div>
            </div>
            
            <div className="h-64">
                <Line options={options} data={distData} />
            </div>
            <div className="h-64">
                <Line options={options} data={goalData} />
            </div>
        </div>
    );
}
