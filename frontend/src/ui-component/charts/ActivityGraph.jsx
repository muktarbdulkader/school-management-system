import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import Fallbacks from 'utils/components/Fallbacks';

const statusColors = {
  done: '#008000',
  pending: '#FFA500',
  cancelled: '#ff8c8c',
  inprogress: '#0000FF',
  blocked: '#A020F0'
};

const getColorForStatus = (status) => statusColors[status.toLowerCase()] || 'gray';

const ActivityGraph = ({ data, type }) => {
  const getSeriesData = (data) => {
    if (!data || data.length === 0) {
      return ['pending', 'inprogress', 'done', 'blocked', 'cancelled'].map((status) => ({
        name: status,
        data: [0],
        color: getColorForStatus(status)
      }));
    }

    return ['pending', 'inprogress', 'done', 'blocked', 'cancelled'].map((status) => ({
      name: status,
      data: data.map((item) => {
        const statusObj = item.statuses.find((s) => s.status === status);
        return statusObj ? parseInt(statusObj.task_count) : 0;
      }),
      color: getColorForStatus(status)
    }));
  };

  const getDates = (data) => (data && data.length > 0 ? data.map((item) => item.date) : ['No Data']);

  const getChartOptions = (type, data) => ({
    chart: {
      type: type,
      height: 380,
      stacked: type === 'line',
      toolbar: {
        show: false
      }
    },

    xaxis: {
      categories: getDates(data),
      labels: {
        formatter: (val) => val
      }
    },
    title: {
      text: ''
    },
    tooltip: {
      x: {
        formatter: (val) => val
      }
    },
    colors: getSeriesData(data).map((series) => series.color) // Use predefined colors
  });

  const [chartState, setChartState] = useState({
    series: getSeriesData(data),
    options: getChartOptions(type, data)
  });

  useEffect(() => {
    setChartState({
      series: getSeriesData(data),
      options: getChartOptions(type, data)
    });
  }, [data, type]);

  return (
    <div>
      {data && data.length > 0 ? (
        <ReactApexChart options={chartState.options} series={chartState.series} type={type} height={380} />
      ) : (
        <Fallbacks
          severity="activities"
          title="No Activity Data Found"
          description="There is no data available to display in the graph."
          sx={{ paddingTop: 6 }}
          size={100}
        />
      )}
    </div>
  );
};

export default ActivityGraph;
