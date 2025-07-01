import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Props = {
  accepted: number;
  rejected: number;
};

export const MetricsChart: React.FC<Props> = ({ accepted, rejected }) => {
  const data = {
    labels: ['Accepted', 'Rejected'],
    datasets: [
      {
        label: 'Loan Stats',
        data: [accepted, rejected],
        backgroundColor: ['#4ade80', '#f87171'],
      },
    ],
  };

  return <Bar data={data} />;
};
