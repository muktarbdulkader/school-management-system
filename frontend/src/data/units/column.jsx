import { Box, Typography, useTheme } from '@mui/material';

const UnitColumns = [
  {
    field: 'name',
    headerName: 'Unit name',
    width: 330,
    renderCell: (params) => {
      return <Typography variant="subtitle1">{params.value}</Typography>;
    },
  },

  {
    field: 'unit_type',
    headerName: 'Unit type',
    width: 220,
    renderCell: (params) => {
      const type = params.value;

      return (
        <Box>
          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
            {type?.name}
          </Typography>
        </Box>
      );
    },
  },
  {
    field: 'manager',
    headerName: 'Manager',
    width: 280,
    renderCell: (params) => {
      const manager = params.value;

      return manager ? (
        <Box>
          <Typography variant="body2">{manager?.user?.name}</Typography>
          <Typography variant="subtitle2">{manager?.position}</Typography>
        </Box>
      ) : (
        <Typography variant="subtitle2">Not Assigned</Typography>
      );
    },
  },
];

export const UnitKpiColumns = [
  {
    field: 'fiscal_year',
    headerName: 'Fiscal Year',
    width: 120,
    renderCell: (params) => {
      return (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {params.value}
        </Typography>
      );
    },
  },
  {
    field: 'period',
    headerName: 'Period',
    width: 120,
    renderCell: (params) => {
      return (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {params.value}
        </Typography>
      );
    },
  },
  {
    field: 'kpi',
    headerName: 'KPI name',
    width: 230,
    renderCell: (params) => {
      return <Typography variant="subtitle1">{params.value}</Typography>;
    },
  },
  {
    field: 'parent_weight',
    headerName: 'Parent KPI Weight ',
    width: 180,
    renderCell: (params) => {
      return <Typography variant="body2">{params.value}%</Typography>;
    },
  },
  {
    field: 'your_weight',
    headerName: 'Unit KPI Weight',
    width: 160,
    renderCell: (params) => {
      return (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {params.value}%
        </Typography>
      );
    },
  },
  {
    field: 'target',
    headerName: 'Target',
    width: 120,
    renderCell: (params) => {
      return (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {params.value}
        </Typography>
      );
    },
  },
  {
    field: 'achivement',
    headerName: 'Target Achievement',
    width: 140,
    renderCell: (params) => {
      return (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {params.value}
        </Typography>
      );
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 140,
    renderCell: (params) => {
      return (
        <Typography
          variant="body2"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: useTheme().palette.primary.light,
            padding: 0.4,
            marginY: 1,
            border: 0.4,
            borderRadius: 4,
            borderColor: useTheme().palette.grey[100],
            textTransform: 'capitalize',
          }}
        >
          {params.value}
        </Typography>
      );
    },
  },
];

export default UnitColumns;
