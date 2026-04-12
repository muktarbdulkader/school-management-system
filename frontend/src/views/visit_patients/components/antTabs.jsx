import { styled } from '@mui/material/styles';
import { Tabs, Tab } from '@mui/material';

export const AntTabs = styled(Tabs)({
  borderBottom: '1px solid #e8e8e8',
  '& .MuiTabs-indicator': {
    backgroundColor: 'primary.main',
  },
});

export const AntTab = styled((props) => <Tab disableRipple {...props} />)(
  ({ theme }) => ({
    textTransform: 'none',
    minWidth: 0,
    [theme.breakpoints.up('sm')]: {
      minWidth: 0,
    },
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(1),
    color: 'rgba(0, 0, 0, 0.85)',
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    '&:hover': {
      color: 'text.primary',
      opacity: 1,
    },
    '&.Mui-selected': {
      color: theme.palette.primary[800],
      fontWeight: theme.typography.fontWeightMedium,
    },
    '&.Mui-focusVisible': {
      backgroundColor: '#d1eaff',
    },
  }),
);

export const tabData = [
  {
    label: 'Complaint',
    component: 'ComplaintTab',
  },

  {
    label: 'History',
    component: 'HistoryTab',
  },
  {
    label: 'Visual Acuity',
    component: 'VisualAcuityTab',
  },
  {
    label: 'Ocular Motility',
    component: 'ocularMotilities',
  },
  {
    label: 'Intraocular Pressure',
    component: 'IntraocularPressureTab',
  },
  {
    label: 'Adnexa Examination',
    component: 'AdnexaExaminationTab',
  },
  {
    label: 'Slit Lamp Examination',
    component: 'SlitLampExaminationTab',
  },
  {
    label: 'Fundus Examinations',
    component: 'FundusExaminationsTab',
  },
  {
    label: 'Initial Impression',
    component: 'InitialImpressionsTab',
  },
];
