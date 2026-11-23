import React from 'react';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function PacketLossChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-500">
        No packet loss data available.
      </div>
    );
  }

  const labels = data.slice(0, 10).map((d) => d.target || `Test #${d.id}`);
  const losses = data.slice(0, 10).map((d) => d.packet_loss || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Packet Loss (%)',
        data: losses,
        backgroundColor: losses.map((loss) =>
          loss === 0 ? 'rgba(16, 185, 129, 0.6)' : loss < 20 ? 'rgba(245, 158, 11, 0.7)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: losses.map((loss) =>
          loss === 0 ? '#10b981' : loss < 20 ? '#f59e0b' : '#ef4444'
        ),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#00f0ff',
        bodyColor: '#e2e8f0',
        borderColor: '#1e293b',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `Packet Loss: ${ctx.raw}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(30, 41, 59, 0.4)' },
        ticks: { color: '#94a3b8', font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(30, 41, 59, 0.6)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          callback: (v) => `${v}%`,
        },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
