import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { addDays, differenceInDays, format, isAfter, isBefore, subDays } from 'date-fns';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PeriodNaming } from 'utils/function';
import Backend from 'services/backend';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import FrequencySelector from './FrequencySelector';
import Fallbacks from 'utils/components/Fallbacks';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import StatusSwitch from 'ui-component/switchs/StatusSwitch';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

const TargetEvaluationPeriod = ({ sx, open, setOpen }) => {
  const theme = useTheme();
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const fiscalYearStartDate = selectedYear?.start_date || '';
  const fiscalYearEndDate = selectedYear?.end_date || '';

  const [loading, setLoading] = useState(true);
  const [frequencies, setFrequencies] = useState([]);
  const [selectedFrequency, setSelectedFrequency] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState();
  const [submitting, setSubmitting] = useState(false);

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [frequencyDetails, setFrequencyDetails] = useState([]);
  const [frequencyChanges, setFrequencyChanges] = useState([]);
  const [changesStatus, setChangeStatus] = useState(false);
  const [toBeUpdated, setToBeUpdated] = useState(null);

  const isEndDateValid = (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    return isBefore(addDays(new Date(startDate), 1), new Date(endDate));
  };

  const shouldDisableDate = (date, isStartDate, index) => {
    const startDate = frequencyChanges[index]?.start_date ? new Date(frequencyChanges[index].start_date) : null;

    if (isStartDate) {
      return isBefore(date, fiscalYearStartDate) || isAfter(date, fiscalYearEndDate);
    } else {
      return (
        isBefore(date, fiscalYearStartDate) || isAfter(date, fiscalYearEndDate) || (startDate && isBefore(date, addDays(startDate, 1)))
      );
    }
  };

  const handleFrequencySelection = (index) => {
    const selected = frequencies[index];
    setSelectedFrequency(selected);
    handleGettingDetails(selected.id, selected.value, index);
  };

  const handleSettingDefaultFrequency = (data) => {
    const quarterIndex = data.findIndex(({ value }) => value === '4');
    if (quarterIndex === -1) return;

    const selected = data[quarterIndex];
    setSelectedFrequency(selected);
    setSelectedIndex(quarterIndex);

    if (selected) {
      handleGettingDetails(selected.id, selected.value, quarterIndex);
    }
  };

  const handleCheckingPeriodAvailablity = (periods, value, index) => {
    if (periods.length === 0 && index >= 0) {
      const fiscalYearStartDate = new Date(selectedYear?.start_date);
      const fiscalYearEndDate = new Date(selectedYear?.end_date);

      const totalDays = differenceInDays(fiscalYearEndDate, fiscalYearStartDate);
      const daysPerQuarter = Math.floor(totalDays / value);

      const newPeriods = Array.from({ length: value }, (v, i) => {
        const start_date = addDays(fiscalYearStartDate, i * daysPerQuarter);
        const end_date = i === value - 1 ? fiscalYearEndDate : addDays(fiscalYearStartDate, (i + 1) * daysPerQuarter - 1);

        const evaluation_start_date = subDays(end_date, 7);
        const evaluation_end_date = end_date;
        const periodName = frequencies[index]?.name ? frequencies[index]?.name : 'Quarter';

        setChangeStatus(true);
        return {
          name: `${PeriodNaming(periodName)} ${i + 1}`,
          start_date: format(start_date, 'yyyy-MM-dd'),
          end_date: format(end_date, 'yyyy-MM-dd'),
          evaluation_period: {
            start_date: format(evaluation_start_date, 'yyyy-MM-dd'),
            end_date: format(evaluation_end_date, 'yyyy-MM-dd')
          },
          status: 'Draft'
        };
      });
      setFrequencyChanges(newPeriods);
    } else {
      setFrequencyChanges(periods);
    }
  };

  const hasChanges = (index) => {
    const originalItem = frequencyDetails[index];
    const currentItem = frequencyChanges[index];

    if (!originalItem || !currentItem) return false;

    const {
      name: originalName,
      start_date: originalStartDate,
      end_date: originalEndDate,
      evaluation_period: originalEvalPeriod
    } = originalItem;
    const { name: currentName, start_date: currentStartDate, end_date: currentEndDate, evaluation_period: currentEvalPeriod } = currentItem;

    return (
      originalName !== currentName ||
      originalStartDate !== currentStartDate ||
      originalEndDate !== currentEndDate ||
      originalEvalPeriod?.start_date !== currentEvalPeriod?.start_date ||
      originalEvalPeriod?.end_date !== currentEvalPeriod?.end_date
    );
  };

  const handleWhichOneChanged = (index) => {
    const originalItem = frequencyDetails[index];
    const currentItem = frequencyChanges[index];

    if (!originalItem || !currentItem) return false;

    const {
      name: originalName,
      start_date: originalStartDate,
      end_date: originalEndDate,
      evaluation_period: originalEvalPeriod
    } = originalItem;
    const { name: currentName, start_date: currentStartDate, end_date: currentEndDate, evaluation_period: currentEvalPeriod } = currentItem;

    let changes = [];

    if (originalName !== currentName || originalStartDate !== currentStartDate || originalEndDate !== currentEndDate) {
      changes.push('periods');
    }
    if (originalEvalPeriod?.start_date !== currentEvalPeriod?.start_date || originalEvalPeriod?.end_date !== currentEvalPeriod?.end_date) {
      changes.push('evaluation');
    }
    return changes;
  };

  const handleGettingDetails = async (id, value, index) => {
    try {
      setLoadingDetails(true);
      const token = await GetToken();
      const Api = Backend.api + Backend.get_frequency_definition + `?fiscal_year_id=${selectedYear?.id}&frequency_id=${id}`;
      const response = await fetch(Api, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (response.ok) {
        setFrequencyDetails(result.data?.periods);
        result.data?.periods.length > 0 && setChangeStatus(false);
        handleCheckingPeriodAvailablity(result.data?.periods, value, index);
      } else {
        toast.error(result.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleFetchingFrequncies = async () => {
    try {
      setLoading(true);

      const token = await GetToken();
      const Api = Backend.api + Backend.frequencies + `?fiscal_year_id=${selectedYear?.id}`;
      const response = await fetch(Api, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        setFrequencies(result.data?.data);

        result.data?.data.length > 0 && handleSettingDefaultFrequency(result.data?.data);
      } else {
        toast.error(result.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (event, index) => {
    const updatedFrequencies = [...frequencyChanges];
    const updatedItem = { ...updatedFrequencies[index], name: event.target.value };
    updatedFrequencies[index] = updatedItem;
    setFrequencyChanges(updatedFrequencies);
  };

  const handleDateChange = (date, index, field, evaluation) => {
    const updatedFrequencies = [...frequencyChanges];
    let updatedItem = { ...updatedFrequencies[index] };

    if (evaluation) {
      updatedItem.evaluation_period = {
        ...updatedItem.evaluation_period,
        [field]: format(date, 'yyyy-MM-dd')
      };
    } else {
      updatedItem[field] = format(date, 'yyyy-MM-dd');
    }

    updatedFrequencies[index] = updatedItem;
    setFrequencyChanges(updatedFrequencies);
  };

  const handleChangeStatus = (index, value) => {
    const updatedFrequencies = [...frequencyChanges];
    updatedFrequencies[index].status = value;
    setFrequencyChanges(updatedFrequencies);
  };

  const handlePeriodSubmission = async () => {
    setSubmitting(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.PeriodDefinition;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      frequency_id: selectedFrequency?.id,
      fiscal_year_id: selectedYear?.id,
      dates: frequencyChanges
    };

    fetch(Api, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response?.data?.message);
          handleGettingDetails(selectedFrequency?.id, selectedFrequency?.value);
          setChangeStatus(false);
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

  const handleSavingChanges = async (id, index) => {
    setToBeUpdated(index);
    setSubmitting(true);

    const changes = handleWhichOneChanged(index);
    const updatedRecord = frequencyChanges[index];

    if (changes.length > 0 && changes[0] === 'periods') {
      const token = await GetToken();
      const Api = Backend.api + Backend.updatePeriod + id;
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      };

      const data = {
        name: updatedRecord?.name,
        start_date: updatedRecord?.start_date,
        end_date: updatedRecord?.end_date,
        evaluation_start_date: updatedRecord?.evaluation_period?.start_date,
        evaluation_end_date: updatedRecord?.evaluation_period?.end_date
      };

      fetch(Api, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(data)
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            toast.success(response.data?.message);
            handleGettingDetails(selectedFrequency.id, selectedFrequency.value);
          } else {
            toast.error(response.data?.message);
          }
        })
        .catch((error) => {
          toast.error(error.message);
        })
        .finally(() => {
          setSubmitting(false);
        });
    }

    if ((changes.length > 0 && changes[0] === 'evaluation') || changes[1] === 'evaluation') {
      const token = await GetToken();
      const Api = Backend.api + Backend.updatePeriod + updatedRecord?.evaluation_period?.id;
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      };

      const data = {
        name: updatedRecord?.name,
        start_date: updatedRecord?.evaluation_period?.start_date,
        end_date: updatedRecord?.evaluation_period?.end_date
      };

      fetch(Api, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(data)
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            toast.success(response.data?.message);
            handleGettingDetails(selectedFrequency.id, selectedFrequency.value);
          } else {
            toast.error(response.data?.message);
          }
        })
        .catch((error) => {
          toast.error(error.message);
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  };

  const handleStatusChange = async (id, newStatus, index) => {
    setToBeUpdated(index);

    setSubmitting(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.changeStatus + id;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
    const status = newStatus.toString();

    const data = {
      status: status
    };

    fetch(Api, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response?.data?.message);
          const status = newStatus.toString();
          handleChangeStatus(index, status);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setSubmitting(false);
        setToBeUpdated(index);
      });
  };

  const handleToggele = () => {
    setOpen(!open);
  };

  useEffect(() => {
    handleFetchingFrequncies();
  }, [selectedYear]);

  return (
    <DrogaCard sx={{ ...sx }}>
      <Grid container>
        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4">Revision Frequencies</Typography>
          {loading ? (
            <ActivityIndicator size={18} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {changesStatus && open && (
                <DrogaButton
                  title={submitting ? <ActivityIndicator size={18} sx={{ color: 'white' }} /> : 'Submit All'}
                  variant="contained"
                  onPress={() => handlePeriodSubmission()}
                  sx={{ marginRight: 3 }}
                />
              )}
              {open && (
                <FrequencySelector
                  options={frequencies}
                  handleSelection={(index) => handleFrequencySelection(index)}
                  index={selectedIndex}
                />
              )}

              <IconButton onClick={() => handleToggele()} sx={{ marginLeft: 2, backgroundColor: theme.palette.grey[100] }}>
                {open ? <IconChevronDown size="1.4rem" stroke="1.4" /> : <IconChevronRight size="1.4rem" stroke="1.4" />}
              </IconButton>
            </Box>
          )}
        </Grid>

        {open && (
          <Grid item xs={12} sx={{ minHeight: 300, marginTop: 3 }}>
            {loadingDetails ? (
              <Grid container>
                <Grid
                  item
                  xs={12}
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 8
                  }}
                >
                  <ActivityIndicator size={20} />
                </Grid>
              </Grid>
            ) : frequencyChanges.length === 0 ? (
              <Fallbacks
                severity="frequencies"
                title="No fisical year range found"
                description="The list of added fisical year range will be listed here"
                sx={{ paddingTop: 6 }}
              />
            ) : (
              <TableContainer sx={{ marginBottom: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      {[
                        'Name',
                        selectedFrequency ? PeriodNaming(selectedFrequency?.name) + ' start' : `Period start`,
                        selectedFrequency ? PeriodNaming(selectedFrequency?.name) + ' end' : `Period end`,
                        'Status'
                      ].map((header, index) => (
                        <TableCell key={index}>
                          <Typography variant="subtitle1" color={theme.palette.text.primary}>
                            {header}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TableBody>
                      {frequencyChanges.map((period, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ width: '200px' }}>
                            <TextField variant="standard" value={period.name} onChange={(event) => handleNameChange(event, index)} />
                          </TableCell>
                          <TableCell>
                            <DatePicker
                              label="Start Date"
                              value={period?.start_date ? new Date(period?.start_date) : null}
                              onChange={(date) => handleDateChange(date, index, 'start_date')}
                              shouldDisableDate={(date) => shouldDisableDate(date, true, index)}
                              renderInput={(params) => <TextField {...params} />}
                            />
                          </TableCell>
                          <TableCell>
                            <DatePicker
                              label="End Date"
                              value={period?.end_date ? new Date(period?.end_date) : null}
                              onChange={(date) => handleDateChange(date, index, 'end_date')}
                              shouldDisableDate={(date) => shouldDisableDate(date, false, index)}
                              renderInput={(params) => (
                                <TextField {...params} error={!isEndDateValid(period?.start_date, period?.end_date)} />
                              )}
                            />
                          </TableCell>

                          <TableCell>
                            {frequencyDetails.length !== 0 && hasChanges(index) ? (
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleSavingChanges(period.id, index)}
                                sx={{ width: '140px', height: 'auto', borderRadius: 2, padding: 1, px: 2 }}
                              >
                                {submitting && toBeUpdated === index ? (
                                  <ActivityIndicator size={18} sx={{ color: 'white' }} />
                                ) : (
                                  'Save Changes'
                                )}
                              </Button>
                            ) : submitting && toBeUpdated === index ? (
                              <ActivityIndicator size={18} sx={{ color: 'primary' }} />
                            ) : (
                              <StatusSwitch
                                checked={period?.status === 'true'}
                                onChange={(e) => handleStatusChange(period.id, e.target.checked, index)}
                                inputProps={{ 'aria-label': 'controlled' }}
                                disabled={changesStatus}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </LocalizationProvider>
                </Table>
              </TableContainer>
            )}
          </Grid>
        )}
      </Grid>
    </DrogaCard>
  );
};

export default TargetEvaluationPeriod;
