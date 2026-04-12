import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useTheme } from '@mui/material/styles';

const PieChartOptions = ({ data, title, size, colors }) => {
  const theme = useTheme();

  const options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent', 
      width: size, 
      height: size, 
      events: {
        render() {
          const chart = this,
            series = chart.series[0];
          let customLabel = chart.options.chart.custom;

          if (!customLabel) {
            customLabel = chart.options.chart.custom = chart.renderer
              .label()
              .css({
                color: theme.palette.text.primary,
                textAnchor: 'middle'
              })
              .add();
          }

          const x = series.center[0] + chart.plotLeft,
            y = series.center[1] + chart.plotTop - customLabel.attr('height') / 2;

          customLabel.attr({
            x,
            y
          });

          customLabel.css({
            fontSize: `${series.center[2] / 12}px`
          });
        }
      }
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    title: {
      text: title,
      align: 'left'
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.0f}%</b>'
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      pie: {
        borderWidth: 0,
        backgroundColor: 'transparent',
        innerSize: '65%',
        dataLabels: {
          enabled: true
        }
      },
      series: {
        allowPointSelect: true,
        cursor: 'pointer',
        borderRadius: 8,
        dataLabels: [
          {
            enabled: false,
            distance: 30,
            format: '{point.name}'
          },
          {
            enabled: false,
            distance: -15,
            format: '{point.percentage:.0f}%',
            style: {
              fontSize: '0.9em'
            }
          }
        ],
        showInLegend: false
      }
    },
    series: [
      {
        name: title,
        colorByPoint: true,
        data: data,
        colors: colors || [] 
      }
    ],
    credits: {
      enabled: false
    }
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default PieChartOptions;
