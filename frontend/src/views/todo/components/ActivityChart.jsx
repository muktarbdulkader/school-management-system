import React from 'react';
import Chart from 'react-apexcharts';

const ActivityChart = () => {
  const generateData = () => {
    let data = [];
    const weeksInMonth = 5;

    for (let i = 0; i < weeksInMonth; i++) {
      let weekData = [];
      for (let j = 0; j < 7; j++) {
        weekData.push({
          x: `Day ${j + 1}`,
          y: Math.floor(Math.random() * 10) + 1
        });
      }
      data.push({ name: `Week ${i + 1}`, data: weekData });
    }
    return data;
  };

  const series = generateData();
  console.log(series);
  const options = {
    chart: {
      type: 'heatmap',
      height: 150,
      width: 150,
      toolbar: { show: false }
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 0, // Square cells
        useFillColorAsStroke: false,
        colorScale: {
          ranges: [
            { from: 1, to: 2, name: 'Low', color: '#EBEDF0' },
            { from: 3, to: 4, name: 'Mid-low', color: '#9BE9A8' },
            { from: 5, to: 6, name: 'Medium', color: '#40C463' },
            { from: 7, to: 8, name: 'Mid-high', color: '#30A14E' },
            { from: 9, to: 10, name: 'High', color: '#216E39' }
          ]
        }
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      type: 'category',
      position: 'bottom',
      labels: {
        rotate: -45,
        style: {
          colors: [],
          fontSize: '10px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '10px'
        }
      }
    },
    grid: {
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      row: {
        colors: ['transparent'],
        opacity: 0.5
      },
      column: {
        colors: ['transparent'],
        opacity: 0.5
      }
    },
    title: {
      text: '',
      align: 'center',
      style: {
        fontSize: '16px'
      }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (value) => `${value} tasks`
      }
    }
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <Chart options={options} series={series} type="heatmap" height={150} />
    </div>
  );
};

export default ActivityChart;
