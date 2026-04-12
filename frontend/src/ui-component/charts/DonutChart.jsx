import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMore from 'highcharts/highcharts-more';
import { useTheme } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

HighchartsMore(Highcharts);

const DonutChart = ({ value, size, label, colors }) => {
  const theme = useTheme();

  const options = {
    chart: {
      type: 'pie',
      width: size,
      height: size,
      spacing: [0, 0, 0, 0],
      backgroundColor: 'transparent',
      events: {
        load: function () {
          const chart = this;
          const centerX = chart.plotWidth / 2;
          const centerY = chart.plotHeight / 2;
          const fontSizeValue = size / 7;
          const fontSizeLabel = size / 15;

          chart.renderer
            .text(`${value}%`, centerX, centerY)
            .attr({
              zIndex: 5,
              align: 'center',
              'text-anchor': 'middle'
            })
            .css({
              fontSize: `${fontSizeValue}px`,
              fontWeight: 500,
              color: grey[800]
            })
            .add();

          chart.renderer
            .text(label, centerX, centerY + fontSizeValue)
            .attr({
              zIndex: 5,
              align: 'center',
              'text-anchor': 'middle'
            })
            .css({
              fontSize: `${fontSizeLabel}px`,
              color: theme.palette.text.secondary
            })
            .add();
        }
      }
    },
    title: {
      text: null
    },
    plotOptions: {
      pie: {
        innerSize: '80%',
        backgroundColor: 'transparent',
        dataLabels: {
          enabled: false
        },
        startAngle: 0,
        endAngle: 360,
        center: ['50%', '50%'],
        borderWidth: 0
      }
    },
    colors: colors || [theme.palette.primary.main, theme.palette.grey[100]],
    series: [
      {
        name: 'Value',
        data: [
          ['Achieved', value],
          ['Remaining', 100 - value]
        ],
        borderWidth: 0,
        colorByPoint: true
      }
    ],
    tooltip: {
      formatter: function () {
        return `${this.key}: ${this.y}%`;
      }
    },
    credits: {
      enabled: false
    }
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default DonutChart;
