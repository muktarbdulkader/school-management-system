import React, { useState, useEffect } from 'react';
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  Box,
  Grid,
  styled,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { PeriodNaming } from 'utils/function';
import { MonitorModal } from './MonitorModal';
import { toast, ToastContainer } from 'react-toastify';
import { IconCircleFilled } from '@tabler/icons-react';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import SlideInDrawer from 'ui-component/modal/SlideInDrawer';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import MonitorAllModal from './MonitorAllModal';
import { PeriodTabs } from './PeriodTabs';
import { pink } from '@mui/material/colors';

const RadiatingStepIcon = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '0.6rem',
  height: '0.6rem',
  marginRight: 8,
  borderRadius: '50%',
  backgroundColor: 'green',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `pulse 1.5s infinite`,

  '@keyframes pulse': {
    '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.5)' },
    '70%': { boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' },
  },
}));

const PlanTable = ({
  hideActions,
  plans,
  unitName,
  unitType,
  onRefresh,
  canMonitor,
}) => {
  const theme = useTheme();
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [targetId, setTargetId] = useState(null);
  const [monitorAllModal, setMonitorAllModal] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [monthOptions, setMonthOptions] = useState([]);
  const [add, setAdd] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentValue, setCurrentValue] = useState('0');
  const [activeMonth, setActiveMonth] = useState('');
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [openDetailDrawer, setOpenDetailDrawer] = useState(false);

  const handleRowClick = (index, planID) => {
    setSelectedRow(index);
    setSelectedTarget(planID);
    setOpenDetailDrawer(true);
  };

  const handleMonitoringClick = (targetId, value, action) => {
    setTargetId(targetId);
    if (action === 'update') {
      setCurrentValue(value);
    } else {
      setCurrentValue('0');
    }
    setAdd(true);
  };

  const handleMonitorAllClick = () => {
    const monitorablePlans = plans.filter((plan) => {
      return plan.targets?.some((target) =>
        target.months?.some((month) => month.status === 'true'),
      );
    });

    if (monitorablePlans.length === 0) {
      toast.warning('No mentionable KPIs found');
      return;
    }

    setSelectedPlans(monitorablePlans);
    setMonitorAllModal(true);
  };

  const handleMonitoring = async (value, activeMonth) => {
    setIsAdding(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.monitor;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      target_setting_id: targetId,
      actual_value: value?.actual_value,
      month: activeMonth,
      description: value?.description,
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setIsAdding(false);
          handleMonitorModalClose();
          toast.success(response.data.message);
          onRefresh();
        } else {
          setIsAdding(false);
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
        setIsAdding(false);
      });
  };

  const handleSelection = (index) => {
    setSelectedPeriodIndex(index);
  };

  const periodOptions = plans[selectedRow]?.targets?.map((target, index) => ({
    name: `${PeriodNaming(target)} ${index + 1}`,
    value: index,
  }));

  const handleMonitorModalClose = () => {
    setAdd(false);
  };

  useEffect(() => {
    if (selectedRow >= 0) {
      const targets = plans[selectedRow]?.targets || [];

      const activePeriodIndex = targets.findIndex((target) =>
        target.months?.some((month) => month.status === 'true'),
      );

      const currentPeriodIndex = targets.findIndex(
        (target) => target.is_current_period,
      );

      // Set the initial period index
      const initialIndex =
        activePeriodIndex !== -1
          ? activePeriodIndex
          : currentPeriodIndex !== -1
            ? currentPeriodIndex
            : 0;

      setSelectedPeriodIndex(initialIndex);
    } else {
      setSelectedPeriodIndex(0);
    }
  }, [plans, selectedRow]);

  useEffect(() => {
    const fetchMonths = () => {
      if (selectedRow >= 0 && plans[selectedRow]?.targets?.length) {
        const target = plans[selectedRow]?.targets[selectedPeriodIndex];
        const currentMonth = new Date().toLocaleString('default', {
          month: 'long',
        });

        const months = target?.months?.map((month) => ({
          label: month.month,
          value: month.month,
          status: month.month === currentMonth ? 'true' : month.status,
        }));

        setMonthOptions(months);

        const currentMonthObj = months.find((month) => month.status === 'true');
        if (currentMonthObj) {
          setActiveMonth(currentMonthObj.value);
        }
      }
    };

    fetchMonths();
  }, [selectedRow, selectedPeriodIndex, plans]);

  const handlesumOfActualValue = (target) => {
    let sum = 0;
    target?.months?.forEach((month) => {
      sum += parseFloat(month.value);
    });
    return sum;
  };

  const handleBulkMonitoring = async (submissions) => {
    setIsAdding(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.monitorAll;

    try {
      const testResponse = await fetch(Api, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_setting_id: submissions[0].target_setting_id,
          actual_value: submissions[0].actual_value,
          month: submissions[0].month,
          description: submissions[0].description,
        }),
      });

      const testResult = await testResponse.json();

      if (!testResponse.ok) {
        throw new Error(testResult.message || 'Test request failed');
      }

      const response = await fetch(Api, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: submissions.map((sub) => ({
            target_setting_id: sub.target_setting_id,
            actual_value: sub.actual_value,
            month: sub.month,
            description: sub.description,
          })),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully updated ${submissions.length} KPIs`);
        onRefresh();
      } else {
        throw new Error(result.message || 'Bulk update failed');
      }
    } catch (error) {
      console.error('Bulk monitoring error:', error);
      toast.error(error.message || 'Failed to update KPIs');

      // Fallback: Try individual updates if bulk fails
      try {
        const individualResults = await Promise.all(
          submissions.map(async (sub) => {
            try {
              const res = await fetch(Backend.api + Backend.monitor, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  target_setting_id: sub.target_setting_id,
                  actual_value: sub.actual_value,
                  month: sub.month,
                  description: sub.description,
                }),
              });
              return await res.json();
            } catch (err) {
              return { success: false, message: err.message };
            }
          }),
        );

        const successful = individualResults.filter((r) => r.success);
        const failed = individualResults.filter((r) => !r.success);

        if (successful.length > 0) {
          toast.success(`Successfully updated ${successful.length} KPIs`);
          onRefresh();
        }
        if (failed.length > 0) {
          toast.error(`Failed to update ${failed.length} KPIs`);
        }
      } catch (fallbackError) {
        toast.error('Failed to update KPIs using fallback method');
      }
    } finally {
      setIsAdding(false);
      setMonitorAllModal(false);
    }
  };

  const currentTarget =
    selectedRow !== null
      ? plans[selectedRow]?.targets[selectedPeriodIndex]
      : null;

  // const shouldShowMonitoring =
  //   !hideActions &&
  //   (currentTarget?.is_current_period ||
  //     (currentTarget?.months?.some((month) => month.status === 'true') &&
  //       currentTarget?.is_current_period));

  const shouldShowMonitoring =
    (!hideActions && currentTarget?.is_previous === true) ||
    currentTarget?.months?.some((month) => month.status === 'true');

  const shouldShowMonitorAll =
    !hideActions &&
    plans?.some((plan) => {
      return plan.targets?.some((target) =>
        target.months?.some((month) => month.status === 'true'),
      );
    });

  // const shouldShowMonitorAll = (buttonJSX) => {
  //   const canShow = plans?.some((plan) => {
  //     const canMonitorPlan = plan.can_monitor !== false;
  //     const hasActiveTargets = plan.targets?.some((target) =>
  //       target.months?.some((month) => month.status === 'true'),
  //     );
  //     return canMonitorPlan && hasActiveTargets;
  //   });

  //   return canShow ? buttonJSX : null;
  // };

  const canShowMonitoringButton = (plan) => {
    if (plan?.can_monitor !== undefined) {
      return plan.can_monitor;
    }

    return true;
  };
  return (
    <React.Fragment>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {shouldShowMonitorAll && (
          <Button
            variant="contained"
            onClick={handleMonitorAllClick}
            disabled={!plans?.length}
            startIcon={<IconCircleFilled size="1rem" />}
          >
            Monitor All KPIs
          </Button>
        )}
      </Box>
      <TableContainer component={Paper} sx={{ minHeight: '22dvh' }}>
        <Table sx={{ minWidth: 450 }} aria-label="unit plan table">
          <TableHead>
            <TableRow>
              <TableCell>KPI Name</TableCell>
              <TableCell>Inherited Weights(%)</TableCell>
              <TableCell>KPI Weights(%)</TableCell>
              <TableCell>Total Targets</TableCell>
              <TableCell>Measuring Unit</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>Detail</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans?.map((plan, index) => (
              <React.Fragment key={plan?.id}>
                <TableRow
                  sx={{
                    backgroundColor:
                      selectedRow == index
                        ? theme.palette.grey[50]
                        : theme.palette.background.default,
                    ':hover': {
                      backgroundColor: theme.palette.grey[50],
                      cursor: 'pointer',
                    },
                  }}
                >
                  <TableCell
                    sx={{ display: 'flex', alignItems: 'center', border: 0 }}
                  >
                    {selectedRow === index && (
                      <IconCircleFilled
                        size="0.6rem"
                        style={{ color: theme.palette.primary[800] }}
                      />
                    )}
                    <Typography variant="subtitle1" ml={1}>
                      {plan?.kpi}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {plan?.inherit_weight
                      ? parseFloat(plan?.inherit_weight).toFixed(1) + '%'
                      : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {parseFloat(plan?.weight).toFixed(1)}%
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>{plan?.total_target}</TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {plan?.measuring_unit}
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>{plan?.frequency}</TableCell>
                  <TableCell sx={{ border: 0 }}>
                    {plan.can_monitor && (
                      <Button
                        variant="text"
                        onClick={() => handleRowClick(index, plan?.id)}
                      >
                        Monitoring
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {targetId && (
        <MonitorModal
          add={add}
          isAdding={isAdding}
          unitName={unitName}
          activeMonth={activeMonth}
          setActiveMonth={setActiveMonth}
          currentValue={currentValue}
          onClose={handleMonitorModalClose}
          handleSubmission={handleMonitoring}
          monthOptions={monthOptions}
          getValueForMonth={async (month) => {
            const monthObj = currentTarget?.months?.find(
              (m) => m.month === month,
            );
            return monthObj?.value || '';
          }}
        />
      )}

      {monitorAllModal && (
        <MonitorAllModal
          open={monitorAllModal}
          onClose={() => setMonitorAllModal(false)}
          plans={selectedPlans}
          unitName={unitName}
          handleSubmit={handleBulkMonitoring}
          monthOptions={monthOptions}
          isAdding={isAdding}
          activeMonth={activeMonth}
          setActiveMonth={setActiveMonth}
          getValueForMonth={async (month, planId) => {
            const plan = selectedPlans.find((p) => p.id === planId);
            if (!plan) return '';

            // Find any target that has the selected month (regardless of status)
            for (const target of plan.targets) {
              const monthObj = target.months?.find((m) => m.month === month);
              if (monthObj) {
                return monthObj.value || '';
              }
            }

            return '';
          }}
        />
      )}
      <ToastContainer />
      {selectedRow !== null && (
        <SlideInDrawer
          open={openDetailDrawer}
          onClose={() => setOpenDetailDrawer(false)}
          title={unitName}
        >
          <Box>
            <Typography variant="subtitle1">
              {plans[selectedRow]?.kpi}
            </Typography>
            <Typography variant="subtitle2" mb={3}>
              KPI
            </Typography>
          </Box>

          <PeriodTabs
            periodOptions={periodOptions}
            onTabChange={handleSelection}
            initialValue={selectedPeriodIndex}
          />

          <Grid
            container
            sx={{ borderBottom: 0.6, borderColor: theme.palette.divider }}
          >
            <Grid item xs={12} my={2}>
              {plans[selectedRow]?.targets[selectedPeriodIndex]?.months?.map(
                (monthObj, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      m: 1,
                      py: 1,
                      width: '86%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {monthObj.status === 'true' && <RadiatingStepIcon />}
                      <Typography variant="body1">{monthObj.month}</Typography>
                    </Box>
                    <Typography variant="h4">{monthObj.value}</Typography>
                  </Box>
                ),
              )}
            </Grid>
          </Grid>

          <Grid container sx={{ display: 'flex' }}>
            <Grid item xs={6}>
              <Box sx={{ mt: 2, p: 1 }}>
                <Typography variant="subtitle1">
                  {plans[selectedRow]?.targets[selectedPeriodIndex]?.target}
                </Typography>
                <Typography variant="subtitle2">Quarter Target</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ mt: 2, p: 1 }}>
                <Typography variant="subtitle1">
                  {
                    plans[selectedRow]?.targets[selectedPeriodIndex]
                      ?.actual_value
                  }
                  <Typography variant="subtitle2">Quarter Actual</Typography>
                </Typography>
              </Box>
            </Grid>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 1,
                p: 1,

                borderRadius: 1,
              }}
            >
              <InfoIcon
                sx={{ color: pink[500] }}
                style={{ marginRight: 8 }}
                size={10}
              />
              <Typography variant="subtitle1" color={theme.palette.error.main}>
                {plans[selectedRow]?.monitor_message}
              </Typography>
            </Box>
          </Grid>

          <Box sx={{ mt: 6, ml: 0.3 }}>
            <Typography variant="subtitle1"></Typography>
            {shouldShowMonitoring && (
              <>
                {currentTarget?.actual_value === 0 ? (
                  <DrogaButton
                    variant="contained"
                    title="Monitor"
                    sx={{ boxShadow: 0 }}
                    fullWidth
                    onPress={() =>
                      handleMonitoringClick(currentTarget?.id, 0, ' ')
                    }
                  />
                ) : (
                  <DrogaButton
                    variant="text"
                    title="Update Monitoring"
                    sx={{
                      boxShadow: 0,
                      backgroundColor: theme.palette.grey[50],
                    }}
                    fullWidth
                    onPress={() =>
                      handleMonitoringClick(
                        currentTarget?.id,
                        currentTarget?.actual_value,
                        'update',
                      )
                    }
                  />
                )}
              </>
            )}
          </Box>
        </SlideInDrawer>
      )}
    </React.Fragment>
  );
};

export default PlanTable;
