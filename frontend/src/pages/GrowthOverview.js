import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

function GrowthOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/growth')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return <p>Loading growth data...</p>;
  }

  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: 'Portfolio Value',
        data: data.values,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
      },
    ],
  };

  return (
    <div>
      <h2>Growth Overview</h2>
      <Line data={chartData} />
    </div>
  );
}

export default GrowthOverview;
