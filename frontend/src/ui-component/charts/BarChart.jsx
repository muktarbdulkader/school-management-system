import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsDrilldown from 'highcharts/modules/drilldown';

HighchartsDrilldown(Highcharts);

const BarChart = ({ data }) => {
  const options = {
    chart: {
      type: 'column',
      backgroundColor: 'transparent'
    },
    title: {
      align: 'left',
      text: 'Evaluation Based on KPIs',
      style: {
        fontSize: '14px',
        color: 'black',
        marginBottom: '15px'
      }
    },
    subtitle: {
      align: 'left',
      text: ''
    },
    accessibility: {
      announceNewData: {
        enabled: true
      }
    },
    xAxis: {
      type: 'category',
      categories: data.length ? data.map((d) => d.name) : ['No Data']
    },
    yAxis: {
      title: {
        text: 'Performance'
      },
      gridLineWidth: 0.5
    },
    legend: {
      enabled: true
    },
    plotOptions: {
      series: {
        borderWidth: 0,
        backgroundColor: 'transparent',
        textColor: 'black',
        dataLabels: {
          enabled: false,
          format: '{point.y:.1f}%'
        }
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:11px ">{series.name}</span><br>',
      pointFormat: '<span style="color:{point.color}">{point.name}</span>: ' + '<b>{point.y:.2f}%</b> of total<br/>'
    },
    series: [
      {
        name: 'KPIs',
        color: '#003B73',
        data: data.length ? data.map((d) => d.value) : [0]
      }
    ],
    credits: {
      enabled: false
    }
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default BarChart;
