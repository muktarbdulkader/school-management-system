import React, { useEffect, useState } from 'react';
import { Box, Button, Grid, Typography, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { months, weeks } from 'data/report';
import { IconCalendarMonth, IconCalendarWeek } from '@tabler/icons-react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import TaskCountSummary from 'views/Report/components/TaskCountSummary';
import SelectorMenu from 'ui-component/menu/SelectorMenu';
import TaskListReport from 'views/Report/components/TaskListReport';
import EachDayActivity from 'views/Report/components/EachDayActivity';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import { useNavigate } from 'react-router-dom';

function TaskEmployeReport({ hideHeadSection, id }) {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const theme = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);

  const [filter, setFilter] = useState({
    week: '1',
    month: '1',
  });

  const handleFiltering = (event) => {
    const { value, name } = event.target;
    setFilter({ ...filter, [name]: value });
  };

  useEffect(() => {
    const handleFetchingTaskReport = async () => {
      if (selectedYear?.id) {
        setLoading(true);
        const token = await GetToken();
        const Api =
          Backend.api +
          Backend.employeeProfileTask +
          id +
          `?fiscal_year_id=${selectedYear?.id}`;

        const header = {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
          'Content-Type': 'application/json',
        };

        fetch(Api, {
          method: 'GET',
          headers: header,
        })
          .then((response) => response.json())
          .then((response) => {
            if (response.success) {
              setData(response.data);
              setError(false);
            } else {
              setError(true);
            }
          })
          .catch((error) => {
            toast.warning(error.message);
            setError(true);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    };

    handleFetchingTaskReport();
  }, [selectedYear]);

  return (
    <Grid container py={2}>
      {!hideHeadSection && (
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          py={2}
        >
          <Typography variant="h4">Tasks Report</Typography>

          <Box sx={{ display: 'flex' }}>
            <SelectorMenu
              name="month"
              options={months}
              selected={filter.month}
              handleSelection={handleFiltering}
              sx={{ border: 0.4, borderRadius: 2, py: 0, mr: 1.6 }}
            />
            <SelectorMenu
              name="week"
              options={weeks}
              selected={filter.week}
              handleSelection={handleFiltering}
              sx={{ border: 0.4, borderRadius: 2, py: 0 }}
            />
          </Box>
        </Grid>
      )}

      {!error ? (
        <Grid item xs={12}>
          <Grid
            container
            spacing={2}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <Grid item xs={12}>
              <DrogaCard
                sx={{ backgroundColor: theme.palette.grey[50], minHeight: 240 }}
              >
                {loading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 2,
                    }}
                  >
                    <ActivityIndicator size={20} />
                  </Box>
                ) : (
                  <TaskCountSummary data={data} />
                )}
              </DrogaCard>
            </Grid>
          </Grid>
        </Grid>
      ) : (
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ErrorPrompt
            title="Server Error"
            message="We have problem retrieving task report"
            size={160}
          />
        </Grid>
      )}
    </Grid>
  );
}

export default TaskEmployeReport;
