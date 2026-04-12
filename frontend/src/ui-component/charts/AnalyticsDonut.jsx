import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { fNumber } from 'utils/format-numbers';

import { Chart, useChart, ChartLegends } from './minimal-charts';
import DrogaCard from 'ui-component/cards/DrogaCard';

// ----------------------------------------------------------------------

export function AnalyticsDonut({ title, subheader, chart, ...other }) {
  const theme = useTheme();

  const chartSeries = chart.series.map((item) => item.value);

  const chartColors = chart.colors || [
    theme.palette.primary.main,
    theme.palette.warning.dark,
    theme.palette.secondary.dark,
    theme.palette.error.main
  ];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    labels: chart.series.map((item) => item.label),
    stroke: { width: 0 },
    dataLabels: { enabled: true, dropShadow: { enabled: false } },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: theme.typography.fontFamily,
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.background.paper
      },
      y: {
        formatter: (value) => fNumber(value),
        title: { formatter: (seriesName) => `${seriesName}` }
      }
    },
    plotOptions: { pie: { donut: { labels: { show: true } } } },
    ...chart.options
  });

  return (
    <DrogaCard {...other} sx={{ p: 0 }}>
      <CardHeader title={title} subheader={subheader} />

      <Chart
        type="donut"
        series={chartSeries}
        options={chartOptions}
        width={{ xs: 240, xl: 260 }}
        height={{ xs: 240, xl: 260 }}
        sx={{ mx: 'auto' }}
      />

      <Divider sx={{ borderStyle: 'dashed' }} />

      <ChartLegends labels={chartOptions?.labels} colors={chartOptions?.colors} sx={{ p: 3, justifyContent: 'center' }} />
    </DrogaCard>
  );
}
