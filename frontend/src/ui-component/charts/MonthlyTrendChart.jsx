import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useTheme, alpha as hexAlpha } from '@mui/material/styles';
import { Chart, useChart } from './minimal-charts';

// ----------------------------------------------------------------------

export function MonthlyTrendChart({ title, subheader, chart, ...other }) {
  const theme = useTheme();

  const chartColors = chart.colors ?? [theme.palette.primary.dark, hexAlpha(theme.palette.primary.light, 0.64)];

  const chartOptions = useChart({
    colors: chartColors,
    stroke: {
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: chart.categories
    },
    legend: {
      show: true
    },
    tooltip: {
      y: {
        formatter: (value) => `${value}`
      }
    },
    ...chart.options
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Chart type="bar" series={chart.series} options={chartOptions} height={364} sx={{ py: 2.5, pl: 1, pr: 2.5 }} />
    </Card>
  );
}
