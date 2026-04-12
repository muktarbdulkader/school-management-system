import React from 'react';
import { Grid, Box, Typography, AccordionDetails, useTheme, IconButton } from '@mui/material';
import Perceptive from '../Perceptive';
import PerformanceScale from '../PerformanceScale';
import JobPositionTable from '../../job-positions';
import Frequency from '../Frequency';
import Period from '../Period';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PageContainer from 'ui-component/MainPage';

function PreSetup() {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(0);

  const handleExpandAccordion = (itemID) => {
    if (itemID === expanded) {
      setExpanded(0);
    } else {
      setExpanded(itemID);
    }
  };

  const setups = [
    {
      id: 1,
      name: 'Frequencies',
      component: <Frequency />
    },
    {
      id: 2,
      name: 'Periods',
      component: <Period />
    },
    {
      id: 4,
      name: 'Perspectives',
      component: <Perceptive />
    },

    {
      id: 6,
      name: 'Performance Rating',
      component: <PerformanceScale />
    },
    {
      id: 7,
      name: 'Job Positions',
      component: <JobPositionTable />
    }
  ];

  return (
    <PageContainer maxWidth="lg" title={'Pre-setups'}>
      <Grid container spacing={3} mt={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Grid item xs={10}>
          <Grid container spacing={1}>
            {setups.map((item, index) => (
              <Grid item xs={12} key={index} expanded={expanded === item.id} sx={{ backgroundColor: theme.palette.background.default }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: expanded === item.id ? theme.palette.primary.main : theme.palette.grey[100],
                    paddingY: 2,
                    paddingX: 2.6,
                    borderRadius: 2,
                    transition: 'all 0.4s ease'
                  }}
                  onClick={() => handleExpandAccordion(item.id)}
                >
                  <Typography variant="h4" color={expanded === item.id ? 'white' : theme.palette.text.primary} sx={{ fontWeight: 'bold' }}>
                    {item.name}
                  </Typography>
                  <IconButton onClick={() => handleExpandAccordion(item.id)}>
                    {expanded === item.id ? <ExpandMoreIcon style={{ color: 'white' }} /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                {expanded === item.id && <AccordionDetails>{item.component}</AccordionDetails>}
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </PageContainer>
  );
}

export default PreSetup;
