import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LatencyChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-500">
        No latency data points available yet.
      </div>
    );
  }

  const labels = data.map((d, idx) => d.target || `Test #${idx + 1}`);
  const latencies = data.map((d) => d.latency);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Latency (ms)',
        data: latencies,
        fill: true,
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        tension: 0.35,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#00f0ff',
        bodyColor: '#e2e8f0',
        borderColor: '#1e293b',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => `Latency: ${context.raw} ms`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(30, 41, 59, 0.4)',
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          maxRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(30, 41, 59, 0.6)',
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          callback: (value) => `${value}ms`,
        },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
