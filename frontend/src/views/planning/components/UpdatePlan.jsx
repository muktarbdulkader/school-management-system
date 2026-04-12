import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  Alert,
  Box,
  CircularProgress,
  Paper,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { UpdatePlanForm } from 'data/planning/forms';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { DistributionValidation, FrequencyValidation, SelectedKPIValidation } from 'utils/validation/planning';
import { useKPI } from 'context/KPIProvider';
import { Storage } from 'configration/storage';
import Backend from 'services/backend';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import GetToken from 'utils/auth-token';
import { TaskProgress } from 'ui-component/steppers/Stepper';

export const UpdatePlan = ({ add, onClose, plan_id, onSucceed, isUpdate, amended }) => {
  const theme = useTheme();
  const smallDevice = useMediaQuery(theme.breakpoints.down('md'));

  const { selectedKpi } = useKPI();
  const [isAdding, setIsAdding] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [error, setError] = React.useState({
    state: false,
    message: ''
  });

  const formSteps = UpdatePlanForm(isUpdate, amended);

  const handleNext = () => {
    if (activeIndex === 0) {
      const validation = SelectedKPIValidation(selectedKpi);
      if (validation.valid) {
        setError({ ...error, state: false, message: '' });
        setActiveIndex(activeIndex + 1);
      } else {
        setError({ ...error, state: true, message: validation.errors[0] });
      }
    } else if (activeIndex === 1) {
      const validation = FrequencyValidation(selectedKpi);
      if (validation.valid) {
        setError({ ...error, state: false, message: '' });
        setActiveIndex(activeIndex + 1);
      } else {
        setError({ ...error, state: true, message: validation.errors[0] });
      }
    }
  };

  const handleBack = () => {
    setError({ ...error, state: false, message: '' });
    setActiveIndex(activeIndex - 1);
  };

  const handlePlanValidation = () => {
    const validation = DistributionValidation(selectedKpi);
    if (validation.valid) {
      setError({ ...error, state: false, message: '' });
      handlePlanSubmission(selectedKpi);
    } else {
      setError({ ...error, state: true, message: validation.errors[0] });
    }
  };

  const handlePlanSubmission = async (plan) => {
    setIsAdding(true);

    const token = await GetToken();
    const getFiscalYear = Storage.getItem('selectFiscal');
    const fiscalYear = JSON.parse(getFiscalYear);

    const Api = Backend.api + Backend.orgPlanUpdate + plan_id;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const planData = plan[0];

    const data = {
      fiscal_year_id: fiscalYear?.id,
      parent_weight: planData?.parent_weight,
      weight: planData?.weight,
      total_target: planData?.total_target,
      targets: planData?.targets,
      objective: planData?.objective
    };

    fetch(Api, {
      method: 'PATCH',
      headers: header,
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response?.data?.message);
          onSucceed();
          onClose();
        } else {
          toast.error(response?.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setIsAdding(false);
      });
  };

  return (
    <React.Fragment>
      <Dialog open={add} onClose={onClose} fullScreen={smallDevice}>
        {selectedKpi && (
          <Paper
            sx={{
              minWidth: { md: '600px' },
              minHeight: '50dvh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 1 }}>
                <Box>
                  <DialogTitle variant="h3" color={theme.palette.text.primary} fontSize={theme.typography.h3}>
                    {formSteps[activeIndex].name}
                  </DialogTitle>
                  <TaskProgress numberOfSteps={formSteps.length} currentIndex={activeIndex} />
                </Box>

                <motion.div
                  whileHover={{
                    rotate: 90
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ cursor: 'pointer', marginRight: 10 }}
                  onClick={onClose}
                >
                  <IconX size="1.4rem" stroke={2} />
                </motion.div>
              </Box>

              <Box
                sx={{
                  padding: 2,
                  height: 'auto',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  '-ms-overflow-style': 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none'
                  }
                }}
              >
                {' '}
                {formSteps[activeIndex].component}
              </Box>
            </div>

            <DialogActions sx={{ paddingX: 3, paddingBottom: 2 }}>
              {error.state && <Alert severity="error"> {error.message}</Alert>}
              {activeIndex > 0 && (
                <Button onClick={() => handleBack()} sx={{ paddingX: 4, paddingY: 1, marginRight: 2 }}>
                  Back
                </Button>
              )}

              {activeIndex === formSteps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ paddingX: 6, paddingY: 1, boxShadow: 0 }}
                  onClick={() => handlePlanValidation()}
                >
                  {isAdding ? (
                    <CircularProgress size={18} sx={{ color: 'white' }} />
                  ) : (
                    <Typography variant="subtitle1" color="white">
                      Submit
                    </Typography>
                  )}
                </Button>
              ) : (
                <DrogaButton
                  type="button"
                  title="Next"
                  variant="contained"
                  sx={{ paddingX: 6, paddingY: 1, boxShadow: 0 }}
                  onPress={() => handleNext()}
                />
              )}
            </DialogActions>
          </Paper>
        )}
      </Dialog>
    </React.Fragment>
  );
};
