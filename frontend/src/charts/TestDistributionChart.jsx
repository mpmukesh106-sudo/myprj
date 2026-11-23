import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function TestDistributionChart({ distribution = {} }) {
  const keys = Object.keys(distribution);
  if (keys.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-500">
        No test distribution records.
      </div>
    );
  }

  const values = Object.values(distribution);

  const colors = [
    '#3b82f6', // PING - Blue
    '#00f0ff', // DNS - Cyan
    '#8b5cf6', // TRACEROUTE - Purple
    '#10b981', // CONNECTIVITY - Emerald
    '#f59e0b', // AUTO_DIAGNOSIS - Amber
  ];

  const chartData = {
    labels: keys,
    datasets: [
      {
        data: values,
        backgroundColor: colors.slice(0, keys.length),
        borderColor: '#0f172a',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          font: { size: 11 },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#00f0ff',
        bodyColor: '#e2e8f0',
        borderColor: '#1e293b',
        borderWidth: 1,
      },
    },
    cutout: '68%',
  };

  return (
    <div className="h-64 w-full flex items-center justify-center">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
