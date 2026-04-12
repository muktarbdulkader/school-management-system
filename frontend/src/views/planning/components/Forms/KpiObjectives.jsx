import { useState } from 'react';
import { Box, Collapse, Grid, IconButton, Paper, TextField, Typography, useTheme } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import { IconChevronRight, IconChevronUp, IconTargetArrow } from '@tabler/icons-react';
import { useKPI } from 'context/KPIProvider';
import { MeasuringUnitConverter, PeriodNaming } from 'utils/function';
import { useSelector } from 'react-redux';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ReactQuill from 'react-quill';

const toolbarOptions = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
  ['clean'],
  [{ header: [1, 2, 3, 4, 5, 6, false] }]
];

const KPIObjectives = () => {
  const theme = useTheme();
  const { selectedKpi, updateKPI } = useKPI();
  const [expand, setExpand] = useState(0);

  const handleAccordion = (index) => {
    if (expand === index) {
      setExpand(null);
    } else {
      setExpand(index);
    }
  };

  const handleObjectiveChange = (id, text) => {
    updateKPI(id, { objective: text });
  };
  return (
    <Box>
      {selectedKpi?.map((kpi, index) => (
        <Box key={index} sx={{ marginY: 2 }}>
          <Paper
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 1.6,
              borderColor: theme.palette.divider,
              backgroundColor: theme.palette.grey[100],
              cursor: 'pointer',
              marginY: 0.4
            }}
            onClick={() => handleAccordion(index, kpi.frequency_id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconTargetArrow size="1.2rem" stroke="1.6" style={{ color: theme.palette.primary[800] }} />
              <Typography variant="subtitle1" ml={1.6}>
                {kpi?.name}
              </Typography>
            </Box>

            <IconButton> {expand === index ? <IconChevronUp size={18} /> : <IconChevronRight size={18} />} </IconButton>
          </Paper>

          <Collapse in={expand === index}>
            <Box
              sx={{
                padding: 1,
                marginY: 0.4
              }}
            >
              <Grid container>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ReactQuill
                    value={kpi?.objective}
                    onChange={(text) => handleObjectiveChange(kpi.id, text)}
                    placeholder="Write the objective here ..."
                    theme="snow"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ align: [] }],
                        ['link']
                      ]
                    }}
                    style={{
                      width: '100%',
                      height: '140px',
                      marginBottom: '34px'
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Box>
      ))}

      <ToastContainer />
    </Box>
  );
};

export default KPIObjectives;
