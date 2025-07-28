import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { City } from '../App';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SimulationData {
  cityName: string;
  original: number;
  simulated: number;
}

export default function CityChart({ cities, region, simulationData }: { cities: City[]; region: string; simulationData: SimulationData | null }) {
  // Helper function for colors
  const colourForPm25 = (pm: number) => {
    if (pm >= 301) return 'rgba(126, 0, 35, '; // Hazardous
    if (pm >= 201) return 'rgba(143, 63, 151, '; // Very Unhealthy
    if (pm >= 151) return 'rgba(255, 0, 0, '; // Unhealthy
    if (pm >= 101) return 'rgba(255, 126, 0, '; // Unhealthy for Sensitive Groups
    if (pm >= 51) return 'rgba(255, 255, 0, '; // Moderate
    return 'rgba(0, 228, 0, '; // Good
  };

  if (!cities.length) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <p className="text-dark text-center">Loading chart data…</p>
      </div>
    );
  }

  // Generate colors based on PM2.5 values with transparency
  const colours = cities.map((city) => {
    if (city.data_source !== 'real_time') return 'rgba(180, 180, 180, 0.85)'; // Offline gray
    if (city.pm25 >= 301) return 'rgba(126, 0, 35, 0.85)'; // #7e0023 - Hazardous
    if (city.pm25 >= 201) return 'rgba(143, 63, 151, 0.85)'; // #8f3f97 - Very Unhealthy
    if (city.pm25 >= 151) return 'rgba(255, 0, 0, 0.85)'; // #ff0000 - Unhealthy
    if (city.pm25 >= 101) return 'rgba(255, 126, 0, 0.85)'; // #ff7e00 - Unhealthy for Sensitive Groups
    if (city.pm25 >= 51) return 'rgba(255, 255, 0, 0.85)'; // #ffff00 - Moderate
    return 'rgba(0, 228, 0, 0.85)'; // #00e400 - Good
  });

  // Generate border colors (darker versions)
  const borderColours = cities.map((city) => {
    if (city.data_source !== 'real_time') return 'rgba(140, 140, 140, 1)'; // Offline gray border
    if (city.pm25 >= 301) return 'rgba(90, 0, 25, 1)'; // Darker #7e0023 - Hazardous
    if (city.pm25 >= 201) return 'rgba(100, 45, 105, 1)'; // Darker #8f3f97 - Very Unhealthy
    if (city.pm25 >= 151) return 'rgba(200, 0, 0, 1)'; // Darker #ff0000 - Unhealthy
    if (city.pm25 >= 101) return 'rgba(200, 90, 0, 1)'; // Darker #ff7e00 - Unhealthy for Sensitive Groups
    if (city.pm25 >= 51) return 'rgba(200, 200, 0, 1)'; // Darker #ffff00 - Moderate
    return 'rgba(0, 180, 0, 1)'; // Darker #00e400 - Good
  });

  // If simulation data exists, show comparison chart for that city
  if (simulationData) {
    const data = {
      labels: ['Current PM₂.₅ Level', 'PM₂.₅ After Washout'],
      datasets: [
        {
          label: 'PM₂.₅ Concentration (µg/m³)',
          data: [simulationData.original, simulationData.simulated],
          backgroundColor: [
            colourForPm25(simulationData.original) + '85', // Add transparency
            colourForPm25(simulationData.simulated) + '85'
          ],
          borderColor: [
            colourForPm25(simulationData.original) + '0)',
            colourForPm25(simulationData.simulated) + '0)'
          ],
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `${simulationData.cityName} - Washout Simulation`,
          font: { size: 16, weight: 'bold' as const },
          color: '#374151',
          padding: { top: 10, bottom: 20 },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#374151',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (context: any) => [`PM₂.₅: ${context.parsed.y.toFixed(1)} µg/m³`],
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#374151', font: { size: 12 } },
          grid: { color: 'rgba(200, 200, 200, 0.5)' },
          title: { display: true, text: 'Scenario', color: '#374151', font: { size: 14, weight: 'bold' as const } },
        },
        y: {
          beginAtZero: true,
          max: Math.max(simulationData.original, simulationData.simulated) + 20,
          ticks: { color: '#374151', font: { size: 12 }, callback: (value: any) => Number(value) },
          grid: { color: 'rgba(235, 235, 235, 0.9)', lineWidth: 2 },
          title: { display: true, text: 'PM₂.₅ Concentration (µg/m³)', color: '#374151', font: { size: 14, weight: 'bold' as const } },
        },
      },
    };

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <Bar data={data} options={options} />
      </div>
    );
  }

  // Regular multi-city chart
  const titlePrefix = region === 'Global' ? 'Global' : region;
  const realTimeCount = cities.filter(city => city.data_source === 'real_time').length;

  const data = {
    labels: cities.map((city) => city.city),
    datasets: [
      {
        label: 'PM₂.₅ Concentration (µg/m³)',
        data: cities.map((city) => city.pm25),
        backgroundColor: colours,
        borderColor: borderColours,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
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
      title: {
        display: true,
        text: `${titlePrefix} PM₂.₅ Levels • ${realTimeCount}/${cities.length} Live`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#374151',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: (context: any) => {
            const city = cities[context[0].dataIndex];
            return city.data_source === 'real_time' ? `${city.city} 📡 LIVE` : `${city.city} ❌ OFFLINE`;
          },
          label: (context: any) => {
            const city = cities[context.dataIndex];
            if (city.data_source !== 'real_time') {
              return ['Status: Offline'];
            }

            const labels = [`PM₂.₅: ${context.parsed.y} µg/m³`];
            if (city.last_updated) {
              try {
                const date = new Date(city.last_updated);
                labels.push(`Updated: ${date.toLocaleTimeString()}`);
              } catch {
                labels.push('Real-time data');
              }
            }
            // Health category determination
            const pm25 = context.parsed.y;
            if (pm25 >= 301) labels.push('Category: Hazardous');
            else if (pm25 >= 201) labels.push('Category: Very Unhealthy');
            else if (pm25 >= 151) labels.push('Category: Unhealthy');
            else if (pm25 >= 101) labels.push('Category: Unhealthy for Sensitive Groups');
            else if (pm25 >= 51) labels.push('Category: Moderate');
            else labels.push('Category: Good');
            
            return labels;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#374151',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.6)',
        },
        title: {
          display: true,
          text: 'Cities',
          color: '#374151',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
      },
      y: {
        beginAtZero: true,
        max: Math.max(...cities.map(c => c.pm25)) + 20,
        ticks: {
          color: '#374151',
          font: {
            size: 12,
          },
          // Show plain numeric tick labels (no health descriptors)
          callback: (value: any) => Number(value),
          stepSize: 50, // Show ticks every 50 units to highlight thresholds
        },
        grid: {
          // Light whitish grid lines; thicker overall for better visibility
          color: 'rgba(235, 235, 235, 0.9)',
          lineWidth: (ctx: any) => {
            const v = ctx.tick.value;
            return v === 50 || v === 100 || v === 150 || v === 200 || v === 300 ? 3 : 2;
          },
        },
        title: {
          display: true,
          text: 'PM₂.₅ Concentration (µg/m³)',
          color: '#374151',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
}
