import React, { useEffect, useState } from 'react';
import { Grid, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import DrogaCard from 'ui-component/cards/DrogaCard';

import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import CardHeader from '@mui/material/CardHeader';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import { fDate } from 'utils/format-time';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import { IconCircle, IconCircleCheckFilled } from '@tabler/icons-react';

const ActivityTimeline = ({ sx, ...other }) => {
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState([]);

  const handleGettingTimelines = async (reload) => {
    try {
      reload && setLoading(true);
      const token = await GetToken();
      const Api = Backend.api + Backend.periodTimeline + `?fiscal_year_id=${selectedYear?.id}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json'
      };

      fetch(Api, {
        method: 'GET',
        headers: header
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            setData(response.data);
            setError(false);
          }
        })
        .catch((error) => {
          toast.error(error.message);
          setError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      toast.error(err.message);
      setError(true);
    }
  };

  useEffect(() => {
    handleGettingTimelines(true);
  }, [selectedYear?.id]);

  return (
    <Grid item xs={12} sm={12} md={6} lg={4} xl={4} sx={{ ...sx }}>
      <DrogaCard {...other} sx={{ p: 0 }}>
        <CardHeader
          title={
            <Typography variant="h4" sx={{ color: 'text.primary' }}>
              Timelines
            </Typography>
          }
          sx={{ color: 'text.primary' }}
        />

        <Timeline
          sx={{
            m: 0,
            px: 3,
            [`& .${timelineItemClasses.root}:before`]: {
              flex: 0,
              padding: 0
            }
          }}
        >
          {loading ? (
            <Grid container>
              <Grid item xs={12} sx={{ p: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size={20} />
              </Grid>
            </Grid>
          ) : error ? (
            <ErrorPrompt title="Server Error" message={`There is an issue getting the fiscal year timelines`} size={100} />
          ) : data.length === 0 ? (
            <Fallbacks
              severity="timeline"
              title={`There is no timeline `}
              description={`The fiscal year major event timeline is listed here`}
              sx={{ paddingTop: 6 }}
              size={100}
            />
          ) : (
            data.map((item, index) => <Item key={item.id} item={item} lastItem={index === data.length - 1} />)
          )}
        </Timeline>
      </DrogaCard>
    </Grid>
  );
};

export default ActivityTimeline;

// ----------------------------------------------------------------------

function Item({ item, lastItem, ...other }) {
  return (
    <TimelineItem {...other}>
      <TimelineSeparator>
        {item.timeline_status ? (
          <IconCircleCheckFilled size="1.4rem" stroke={1.8} style={{ color: '#009e48', marginTop: 10 }} />
        ) : (
          <IconCircle size="1.2rem" stroke={1.8} style={{ color: '#e0e0e0' }} />
        )}

        {lastItem ? null : <TimelineConnector sx={{ backgroundColor: item.timeline_status ? '#009e48' : '#e0e0e0', my: 0.4 }} />}
      </TimelineSeparator>

      <TimelineContent>
        <Typography variant="subtitle1" color="text.primary">
          {item.name}
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          {fDate(item.start_date)} - {fDate(item.end_date)}
        </Typography>
      </TimelineContent>
    </TimelineItem>
  );
}
