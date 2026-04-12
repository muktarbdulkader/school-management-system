import React from 'react';
import {
  Box,
  IconButton,
  useMediaQuery,
  Typography,
  Menu,
  MenuItem,
} from '@mui/material';
import { AntTabs, AntTab, tabData } from './antTabs';
import TabPanel from 'ui-component/tabs/TabPanel';
import ComplaintTab from './Complaint/ComplaintTab';
import OcularHistoryTab from './OcularHistoryTab';
import { useTheme } from '@emotion/react';
import { a11yProps } from 'utils/function';
import HistoryTab from './History/HistoryTab';
import VisualAcuityTab from './VisualAcuity/VisualAcuityTab';
import OcularMotility from './Ocular Motility/OcularMotility';
import IntraocularPressureTab from './IntraocularPressure/IntraocularPressureTab';
import AdnexaExaminationTab from './AdnexaExamination/AdnexaExaminationTab';
import SlitLampExaminationTab from './SlitLampExamination/SlitLampExaminationTab';
import MenuIcon from '@mui/icons-material/Menu';
import InitialImpressionsTab from './InitialImpressions/InitialImpressionsTab';
import FundusExaminationsTab from './FundusExaminations/FundusExaminationsTab';

const PatientTabs = ({ patient }) => {
  const [value, setValue] = React.useState(0);
  const theme = useTheme();
  const visit = patient;
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Detect mobile view
  const [anchorEl, setAnchorEl] = React.useState(null); // For mobile menu

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (index) => {
    setValue(index);
    handleMenuClose();
  };

  const tabComponents = {
    ComplaintTab: <ComplaintTab visit={visit} />,
    HistoryTab: <HistoryTab visit={visit} />,
    VisualAcuityTab: <VisualAcuityTab visit={visit} />,
    ocularMotilities: <OcularMotility visit={visit} />,
    IntraocularPressureTab: <IntraocularPressureTab visit={visit} />,
    AdnexaExaminationTab: <AdnexaExaminationTab visit={visit} />,
    SlitLampExaminationTab: <SlitLampExaminationTab visit={visit} />,
    InitialImpressionsTab: <InitialImpressionsTab visit={visit} />,
    FundusExaminationsTab: <FundusExaminationsTab visit={visit} />,
  };

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      {/* Mobile View - Dropdown Menu */}
      {isMobile && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton
              onClick={handleMenuOpen}
              sx={{ mr: 1, color: 'primary.main' }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6">
              {tabData[value]?.label || 'Select Tab'}
            </Typography>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              style: {
                maxHeight: '70vh',
                width: '60vw',
              },
            }}
          >
            {tabData.map((tab, index) => (
              <MenuItem
                key={index}
                selected={index === value}
                onClick={() => handleMenuItemClick(index)}
                sx={{
                  minHeight: 'auto',
                  padding: '8px 16px',
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.light,
                  },
                }}
              >
                {tab.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {/* Desktop View - Horizontal Tabs */}
      {!isMobile && (
        <Box
          sx={{
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: theme.palette.grey[100],
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.primary.main,
              borderRadius: '3px',
            },
          }}
        >
          <AntTabs
            value={value}
            onChange={handleChange}
            aria-label="Patient medical tabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTabs-scrollButtons': {
                color: theme.palette.primary.main,
              },
            }}
          >
            {tabData.map((tab, index) => (
              <AntTab
                key={index}
                label={tab.label}
                iconPosition="start"
                {...a11yProps(index)}
                sx={{
                  minWidth: 'unset',
                  padding: '6px 16px',
                  whiteSpace: 'nowrap',
                }}
              />
            ))}
          </AntTabs>
        </Box>
      )}

      {/* Tab Panels (same for both mobile and desktop) */}
      {tabData.map((tab, index) => (
        <TabPanel key={index} value={value} index={index} dir={theme.direction}>
          {tabComponents[tab.component]}
        </TabPanel>
      ))}
    </Box>
  );
};

export default PatientTabs;
