import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, isBefore, isAfter, format } from 'date-fns';
import { toast } from 'react-toastify';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import StatusSwitch from 'ui-component/switchs/StatusSwitch';

const StaticPeriodsComponent = ({ data, fiscalYear, onRefresh }) => {
  const theme = useTheme();
  const [periods, setPeriods] = useState({});
  const [theKey, setTheKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    if (data) {
      const transformedData = Object.keys(data).reduce((acc, key) => {
        acc[key] = {
          ...data[key],
          start_date: data[key]?.start_date || null,
          end_date: data[key]?.end_date || null,
          status: data[key]?.status || false,
        };
        return acc;
      }, {});

      setPeriods(transformedData);
    }
  }, [data]);

  const handleDateChange = (date, key, field) => {
    setPeriods({
      ...periods,
      [key]: { ...periods[key], [field]: date },
    });
  };

  const hasChanges = (key) => {
    const originalItem = data[key];
    const currentItem = periods[key];

    return (
      originalItem?.start_date !== currentItem?.start_date ||
      originalItem?.end_date !== currentItem?.end_date
    );
  };

  const isEndDateValid = (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    return isBefore(addDays(new Date(startDate), 1), new Date(endDate));
  };

  const shouldDisableDate = (date, isStartDate, key) => {
    const startDate = periods[key]?.start_date
      ? new Date(periods[key].start_date)
      : null;

    if (isStartDate) {
      return (
        isBefore(date, fiscalYear?.start_date) ||
        isAfter(date, fiscalYear?.end_date)
      );
    } else {
      return (
        isBefore(date, fiscalYear?.start_date) ||
        isAfter(date, fiscalYear?.end_date) ||
        (startDate && isBefore(date, addDays(startDate, 1)))
      );
    }
  };

  const handleApiEndpoint = (key) => {
    switch (key) {
      case 'Planning':
        return Backend.api + Backend.planningPeriod;

      case 'Revision':
        return Backend.api + Backend.revisionPeriod;
      default:
        return Backend.api + Backend.planningPeriod;
    }
  };

  const handleSaveChanges = async (key) => {
    setTheKey(key);
    setSubmitting(true);
    const token = await GetToken();
    const Api = handleApiEndpoint(key);
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const startDate = new Date(periods[key]?.start_date);
    const endDate = new Date(periods[key]?.end_date);

    const data = {
      fiscal_year_id: fiscalYear.id,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
    };

    fetch(Api, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response?.data?.message);
          onRefresh();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleChangingStatus = async (key, newStatus) => {
    setTheKey(key);
    setChangingStatus(true);
    const id = periods[key]?.id;
    const token = await GetToken();
    const Api = Backend.api + Backend.changeStatus + id;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    const status = newStatus.toString();
    const data = {
      status: status,
    };

    fetch(Api, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response?.data?.message);
          setPeriods({
            ...periods,
            [key]: { ...periods[key], status: newStatus },
          });
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setChangingStatus(false);
      });
  };

  const handleStatusChange = (key, newStatus) => {
    const status = newStatus.toString();
    handleChangingStatus(key, status);
  };

  return (
    <TableContainer sx={{ marginBottom: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'grey.50' }}>
            {['Name', 'Start Date', 'End Date', 'Status'].map(
              (header, index) => (
                <TableCell key={index}>
                  <Typography
                    variant="subtitle1"
                    color={theme.palette.text.primary}
                  >
                    {header}
                  </Typography>
                </TableCell>
              ),
            )}
          </TableRow>
        </TableHead>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <TableBody>
            {Object.keys(periods).map(
              (key) =>
                key != 'Monitoring' && (
                  <TableRow key={key}>
                    <TableCell>
                      <Typography variant="h4">{key}</Typography>
                    </TableCell>
                    <TableCell>
                      <DatePicker
                        label="Start Date"
                        value={
                          periods[key]?.start_date
                            ? new Date(periods[key]?.start_date)
                            : null
                        }
                        onChange={(date) =>
                          handleDateChange(date, key, 'start_date')
                        }
                        shouldDisableDate={(date) =>
                          shouldDisableDate(date, true, key)
                        }
                        renderInput={(params) => <TextField {...params} />}
                      />
                    </TableCell>
                    <TableCell>
                      <DatePicker
                        label="End Date"
                        value={
                          periods[key]?.end_date
                            ? new Date(periods[key]?.end_date)
                            : null
                        }
                        onChange={(date) =>
                          handleDateChange(date, key, 'end_date')
                        }
                        shouldDisableDate={(date) =>
                          shouldDisableDate(date, false, key)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            error={
                              !isEndDateValid(
                                periods[key]?.start_date,
                                periods[key]?.end_date,
                              )
                            }
                          />
                        )}
                        disabled={!periods[key]?.start_date}
                      />
                    </TableCell>
                    <TableCell>
                      {hasChanges(key) ? (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleSaveChanges(key)}
                          disabled={
                            !isEndDateValid(
                              periods[key]?.start_date,
                              periods[key]?.end_date,
                            )
                          }
                          sx={{
                            width: '140px',
                            height: 'auto',
                            borderRadius: 2,
                            padding: 1,
                            px: 2,
                          }}
                        >
                          {theKey === key && submitting ? (
                            <ActivityIndicator
                              size={18}
                              sx={{ color: 'white' }}
                            />
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      ) : changingStatus && theKey === key ? (
                        <ActivityIndicator
                          size={18}
                          sx={{ color: 'primary' }}
                        />
                      ) : (
                        <StatusSwitch
                          checked={periods[key]?.status === 'true'}
                          onChange={(e) =>
                            handleStatusChange(key, e.target.checked)
                          }
                          inputProps={{ 'aria-label': 'controlled' }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ),
            )}
          </TableBody>
        </LocalizationProvider>
      </Table>
    </TableContainer>
  );
};

export default StaticPeriodsComponent;
