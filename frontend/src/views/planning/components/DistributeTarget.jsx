import React, { useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  Fade,
  Grid,
  IconButton,
  InputBase,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import {
  IconInfoCircle,
  IconLayoutDistributeHorizontal,
  IconMaximize,
  IconMinimize,
  IconX,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import {
  firstSlideEmployee,
  firstSlideUnit,
  unitTargetValidation,
} from 'utils/validation/distribution';
import { useTarget } from 'context/TargetContext';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import PropTypes from 'prop-types';
import DrogaButton from 'ui-component/buttons/DrogaButton';

const DistributeTarget = ({
  add,
  onClose,
  plan_id,
  targets,
  naming,
  remainingTarget,
  onRefresh,
}) => {
  const theme = useTheme();
  const {
    unitPayload,
    selectedUnits,
    addUnit,
    handleUnitTargetChange,
    handleParentWeightChange,
    handleUnitTargetCalculation,
    handleUnitWeightChange,
    handleResettingTarget,
    handleCloningUnitTarget,

    employeePayload,
    selectedEmployees,
    addEmployee,
    handleEmployeeTargetChange,
    handleEmployeeParentWeightChange,
    handleEmployeeTargetCalculation,
    handleCloningEmployeeTarget,
    handleEmployeeWeightChange,
  } = useTarget(); //target context values and functions

  const [fullScreen, setFullScreen] = useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const prevIndex = useRef(currentIndex);
  const [direction, setDirection] = useState('next');
  const [assignTo, setAssignTo] = React.useState('units');
  const [isAdding, setIsAdding] = React.useState(false);

  const [units, setUnits] = useState([]);
  const [error, setError] = React.useState({
    state: false,
    message: '',
  });

  const handleExpanding = () => {
    setFullScreen(!fullScreen);
  };

  const handleAssignTo = (value) => {
    setAssignTo(value);
  };

  const handleUnitsChange = (event, value) => {
    addUnit(value, targets[currentIndex].target);
  };

  const handleEmployeesChange = (event, value) => {
    addEmployee(value, targets[currentIndex].target);
  };

  const handleFetchingUnits = async () => {
    setUnits([]);
    const token = await GetToken();
    const Api = Backend.api + Backend.childUnits;
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
          setUnits(response.data);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const handleNext = () => {
    if (currentIndex === 0 && assignTo === 'units') {
      const validation = firstSlideUnit(unitPayload, targets[currentIndex].id);
      if (validation.valid) {
        setDirection('next');
        setCurrentIndex((prevIndex) => (prevIndex + 1) % targets.length);
        setError({ ...error, state: false, message: '' });
      } else {
        setError({ ...error, state: true, message: validation.errors[0] });
      }
    }

    if (currentIndex > 0 && assignTo === 'units') {
      const validation = unitTargetValidation(
        unitPayload,
        targets[currentIndex].id,
      );

      if (validation.valid) {
        setDirection('next');
        setCurrentIndex((prevIndex) => (prevIndex + 1) % targets.length);
        setError({ ...error, state: false, message: '' });
      } else {
        setError({ ...error, state: true, message: validation.errors[0] });
      }
    }

    if (currentIndex === 0 && assignTo === 'employees') {
      const validation = firstSlideEmployee(
        employeePayload,
        targets[currentIndex].id,
      );
      if (validation.valid) {
        setDirection('next');
        setCurrentIndex((prevIndex) => (prevIndex + 1) % targets.length);
        setError({ ...error, state: false, message: '' });
      } else {
        setError({ ...error, state: true, message: validation.errors[0] });
      }
    }

    if (currentIndex > 0 && assignTo === 'employees') {
      const validation = unitTargetValidation(
        employeePayload,
        targets[currentIndex].id,
      );
      if (validation.valid) {
        setDirection('next');
        setCurrentIndex((prevIndex) => (prevIndex + 1) % targets.length);
        setError({ ...error, state: false, message: '' });
      } else {
        setError({ ...error, state: true, message: validation.errors[0] });
      }
    }
  };

  //  ----------- CALCULATE THE REMAINING TARGET -------- START ------
  const handleRemainingTargetCalculation = (targetLeft, total) => {
    const target = parseFloat(targetLeft) || 0;
    const totalAmount = parseFloat(total) || 0;

    const remaining = (target / 100) * totalAmount;

    return remaining;
  };

  //  ----------- CALCULATE THE REMAINING TARGET -------- END ------

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection('prev');
      setCurrentIndex(
        (prevIndex) => (prevIndex - 1 + targets.length) % targets.length,
      );
    }
  };

  const handleSubmissionValidation = () => {
    const unitValidation = unitTargetValidation(
      unitPayload,
      targets[currentIndex].id,
    );
    const employeeValidation = unitTargetValidation(
      employeePayload,
      targets[currentIndex].id,
    );

    if (!unitValidation.valid) {
      setError({ ...error, state: true, message: unitValidation.errors[0] });
      return false;
    }

    if (!employeeValidation.valid) {
      setError({
        ...error,
        state: true,
        message: employeeValidation.errors[0],
      });
      return false;
    }

    if (unitValidation.valid && employeeValidation.valid) {
      return true;
    }
  };

  const handleSubmission = async () => {
    if (handleSubmissionValidation()) {
      setError({ ...error, state: false, message: '' });
      setIsAdding(true);
      const token = await GetToken();
      const Api = Backend.api + Backend.distributeTarget;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const data = {
        plan_id: plan_id,
        unit_target: unitPayload,
        employee_target: employeePayload,
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
            toast.success(response.data?.message);
            onClose();
            onRefresh();
            handleResettingTarget();
          } else {
            setIsAdding(false);
            toast.error(response.data?.message);
          }
        })
        .catch((error) => {
          toast.error(error.message);
          setIsAdding(false);
        });
    }
  };

  useEffect(() => {
    handleFetchingUnits();

    return () => {};
  }, []);

  useEffect(() => {
    prevIndex.current = currentIndex;
  }, [currentIndex]);

  return (
    <React.Fragment>
      <Dialog open={add} onClose={onClose} fullScreen={fullScreen}>
        <Box
          sx={{
            position: 'absolute',
            right: 6,
            top: 10,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <motion.div>
            <IconButton
              sx={{ cursor: 'pointer', marginRight: 2 }}
              onClick={() => handleExpanding()}
            >
              {fullScreen ? (
                <IconMinimize size="1.2rem" stroke={2.4} />
              ) : (
                <IconMaximize size="1.2rem" stroke={2.4} />
              )}
            </IconButton>
          </motion.div>

          <motion.div>
            <IconButton
              sx={{ cursor: 'pointer', marginRight: 1 }}
              onClick={onClose}
            >
              <IconX size="1.2rem" stroke={2} />
            </IconButton>
          </motion.div>
        </Box>
        {targets.length > 0 && (
          <Grid
            container
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: '600px',
              padding: 1.2,
            }}
          >
            <Grid
              item
              xs={12}
              sx={{ display: 'flex', flexDirection: 'column' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: direction === 'next' ? 100 : -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction === 'next' ? -100 : 100 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingRight: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <DialogTitle variant="h4">
                        {naming} {currentIndex + 1}
                      </DialogTitle>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          paddingX: 2,
                          borderLeft: 1,
                        }}
                      >
                        <Typography variant="body2">
                          {remainingTarget === 0
                            ? 'Total target is'
                            : remainingTarget === 100
                              ? 'Fully distributed, the total target was'
                              : 'The remaining target is'}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            backgroundColor: theme.palette.grey[100],
                            paddingX: 2,
                            borderRadius: 10,
                            marginLeft: 1,
                          }}
                        >
                          {remainingTarget === 0 || remainingTarget === 100
                            ? targets[currentIndex].target
                            : handleRemainingTargetCalculation(
                                remainingTarget,
                                targets[currentIndex].target,
                              )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ paddingX: 2, marginTop: 1.4 }}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', marginY: 1 }}
                    >
                      {['units', 'employees'].map((item, index) => (
                        <Chip
                          key={index}
                          label={item}
                          sx={{
                            marginLeft: 1,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                          }}
                          color="primary"
                          variant={assignTo === item ? 'filled' : 'outlined'}
                          onClick={() => handleAssignTo(item)}
                        />
                      ))}
                    </Box>
                    {currentIndex === 0 && (
                      <>
                        {assignTo === 'employees' ? (
                          <Autocomplete
                            id="employee_list"
                            multiple
                            options={units?.employees || []}
                            getOptionLabel={(option) => option.user?.name || ''}
                            value={selectedEmployees}
                            onChange={handleEmployeesChange}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => (
                                <Chip
                                  key={option.user?.id || index}
                                  className="employee-chips"
                                  label={option.user?.name || ''}
                                  {...getTagProps({ index })}
                                />
                              ))
                            }
                            fullWidth
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select an employee"
                                variant="outlined"
                              />
                            )}
                            sx={{ marginTop: 4 }}
                            disableClearable
                          />
                        ) : (
                          <Autocomplete
                            id="unit_list"
                            multiple
                            options={units?.child_unit || []}
                            getOptionLabel={(option) => option.name || ''}
                            value={selectedUnits}
                            onChange={handleUnitsChange}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => (
                                <Chip
                                  key={option.id || index}
                                  className="unit-chips"
                                  label={option.name || ''}
                                  {...getTagProps({ index })}
                                />
                              ))
                            }
                            fullWidth
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select a unit"
                                variant="outlined"
                              />
                            )}
                            sx={{ marginTop: 4 }}
                            disableClearable
                          />
                        )}
                      </>
                    )}
                    {assignTo === 'employees' ? (
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ minWidth: 120 }}>
                              Employee name
                            </TableCell>
                            {currentIndex === 0 && (
                              <TableCell sx={{ minWidth: 80 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-around',
                                  }}
                                >
                                  <Typography variant="subtitle1">
                                    {' '}
                                    Parent weight
                                  </Typography>

                                  <Tooltip
                                    TransitionComponent={Fade}
                                    TransitionProps={{ timeout: 600 }}
                                    title="Parent weight is an amount, the KPI weighted for parent unit"
                                  >
                                    <IconInfoCircle
                                      size="1.2rem"
                                      stroke="1.6"
                                    />
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            )}

                            {currentIndex === 0 && (
                              <TableCell
                                sx={{
                                  minWidth: 80,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-around',
                                  }}
                                >
                                  <Typography variant="subtitle1">
                                    Child weight
                                  </Typography>

                                  <Tooltip
                                    TransitionComponent={Fade}
                                    TransitionProps={{ timeout: 600 }}
                                    title="Child weight is a weight, the KPI holds for the selected unit in the selected fiscal year"
                                  >
                                    <IconInfoCircle
                                      size="1.2rem"
                                      stroke="1.6"
                                    />
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            )}

                            <TableCell sx={{ minWidth: 80 }}>Targets</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {employeePayload.length === 0 ? (
                            <TableRow>
                              <TableCell
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: 2,
                                  border: 0,
                                }}
                                colSpan={3}
                              >
                                Please select employee
                              </TableCell>
                            </TableRow>
                          ) : (
                            employeePayload?.map((unit, index) => {
                              const targetIndex = unit.unit_targets?.findIndex(
                                (target) =>
                                  target.parent_id === targets[currentIndex].id,
                              );
                              const targetValue =
                                targetIndex !== -1 && targetIndex !== undefined
                                  ? unit.unit_targets[targetIndex].target
                                  : '';

                              return (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {unit.unit_name}
                                    </Typography>
                                  </TableCell>

                                  {currentIndex === 0 && (
                                    <>
                                      <TableCell>
                                        <InputBase
                                          name="employee-parent-weight"
                                          sx={{
                                            p: 0.5,
                                            border: 0.4,
                                            borderRadius: 2,
                                            borderColor: 'primary.main',
                                          }}
                                          value={unit.parent_weight}
                                          onChange={(event) =>
                                            handleEmployeeParentWeightChange(
                                              event,
                                              unit.unit_id,
                                            )
                                          }
                                          onBlur={() =>
                                            handleEmployeeTargetCalculation(
                                              targets,
                                              unit.parent_weight,
                                              unit.unit_id,
                                            )
                                          }
                                          inputProps={{
                                            'aria-label': 'target',
                                          }}
                                          type="number"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <InputBase
                                          name="employee-child-weight"
                                          sx={{
                                            p: 0.5,
                                            border: 0.4,
                                            borderRadius: 2,
                                            borderColor: 'primary.main',
                                          }}
                                          value={unit.child_weight}
                                          onChange={(event) =>
                                            handleEmployeeWeightChange(
                                              event,
                                              unit.unit_id,
                                            )
                                          }
                                          inputProps={{
                                            'aria-label': 'target',
                                          }}
                                          type="number"
                                        />
                                      </TableCell>
                                    </>
                                  )}
                                  <TableCell>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                      }}
                                    >
                                      <InputBase
                                        name="employee-target"
                                        sx={{
                                          p: 0.5,
                                          border: 0.4,
                                          borderRadius: 2,
                                          borderColor: 'primary.main',
                                        }}
                                        value={targetValue}
                                        onChange={(event) =>
                                          handleEmployeeTargetChange(
                                            event,
                                            targets[currentIndex].id,
                                            unit.unit_id,
                                          )
                                        }
                                        inputProps={{ 'aria-label': 'target' }}
                                        type="number"
                                      />
                                      {index === 0 &&
                                        employeePayload.length > 1 && (
                                          <IconButton
                                            sx={{ marginRight: 2 }}
                                            onClick={() =>
                                              handleCloningEmployeeTarget(
                                                currentIndex,
                                                targets[currentIndex]?.id,
                                              )
                                            }
                                            title="Clone values"
                                          >
                                            <IconLayoutDistributeHorizontal size="1.2rem" />
                                          </IconButton>
                                        )}
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    ) : (
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ minWidth: 120 }}>
                              Unit name
                            </TableCell>
                            {currentIndex === 0 && (
                              <TableCell sx={{ minWidth: 80 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-around',
                                  }}
                                >
                                  <Typography variant="subtitle1">
                                    {' '}
                                    Parent weight
                                  </Typography>

                                  <Tooltip
                                    TransitionComponent={Fade}
                                    TransitionProps={{ timeout: 600 }}
                                    title="Parent weight is an amount, the KPI weighted for parent unit"
                                  >
                                    <IconInfoCircle
                                      size="1.2rem"
                                      stroke="1.6"
                                    />
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            )}
                            {currentIndex === 0 && (
                              <TableCell sx={{ minWidth: 80 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-around',
                                  }}
                                >
                                  <Typography variant="subtitle1">
                                    Child weight
                                  </Typography>
                                  <Tooltip
                                    TransitionComponent={Fade}
                                    TransitionProps={{ timeout: 600 }}
                                    title="Child weight is a weight, this KPI holds for the selected unit in the selected fiscal year"
                                  >
                                    <IconInfoCircle
                                      size="1.2rem"
                                      stroke="1.6"
                                    />
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            )}
                            <TableCell sx={{ minWidth: 80 }}>Targets</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {unitPayload.length === 0 ? (
                            <TableRow>
                              <TableCell
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: 2,
                                  border: 0,
                                }}
                                colSpan={3}
                              >
                                Please select unit
                              </TableCell>
                            </TableRow>
                          ) : (
                            unitPayload?.map((unit, index) => {
                              const targetIndex = unit.unit_targets?.findIndex(
                                (target) =>
                                  target.parent_id === targets[currentIndex].id,
                              );
                              const targetValue =
                                targetIndex !== -1 && targetIndex !== undefined
                                  ? unit.unit_targets[targetIndex].target
                                  : '';

                              return (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {unit.unit_name}
                                    </Typography>
                                  </TableCell>

                                  {currentIndex === 0 && (
                                    <>
                                      <TableCell>
                                        <InputBase
                                          name="unit-parent-weight"
                                          sx={{
                                            p: 0.5,
                                            border: 1,
                                            borderRadius: 2,
                                            borderColor: 'primary.main',
                                          }}
                                          value={unit.parent_weight}
                                          onChange={(event) =>
                                            handleParentWeightChange(
                                              event,
                                              unit.unit_id,
                                            )
                                          }
                                          onBlur={() =>
                                            handleUnitTargetCalculation(
                                              targets,
                                              unit.parent_weight,
                                              unit.unit_id,
                                            )
                                          }
                                          inputProps={{
                                            'aria-label': 'target',
                                          }}
                                        />
                                      </TableCell>

                                      <TableCell>
                                        <InputBase
                                          name="unit-child-weight"
                                          sx={{
                                            p: 0.5,
                                            border: 1,
                                            borderRadius: 2,
                                            borderColor: 'primary.main',
                                          }}
                                          value={unit.child_weight}
                                          onChange={(event) =>
                                            handleUnitWeightChange(
                                              event,
                                              unit.unit_id,
                                            )
                                          }
                                          inputProps={{
                                            'aria-label': 'target',
                                          }}
                                        />
                                      </TableCell>
                                    </>
                                  )}

                                  <TableCell>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                      }}
                                    >
                                      <InputBase
                                        name="unit-target"
                                        sx={{
                                          p: 0.5,
                                          border: 1,
                                          borderRadius: 2,
                                          borderColor: 'primary.main',
                                        }}
                                        value={targetValue}
                                        onChange={(event) =>
                                          handleUnitTargetChange(
                                            event,
                                            targets[currentIndex].id,
                                            unit.unit_id,
                                          )
                                        }
                                        inputProps={{ 'aria-label': 'target' }}
                                        type="number"
                                      />
                                      {index === 0 &&
                                        unitPayload.length > 1 && (
                                          <IconButton
                                            sx={{ marginRight: 2 }}
                                            onClick={() =>
                                              handleCloningUnitTarget(
                                                currentIndex,
                                                targets[currentIndex].id,
                                              )
                                            }
                                            title="Clone values"
                                          >
                                            <IconLayoutDistributeHorizontal size="1.2rem" />
                                          </IconButton>
                                        )}
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </Box>
                </motion.div>
              </AnimatePresence>

              <DialogActions
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}
              >
                <Box>
                  {' '}
                  {error.state && (
                    <Alert severity="error"> {error.message}</Alert>
                  )}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingX: 2,
                  }}
                >
                  {currentIndex > 0 && (
                    <Button
                      sx={{ marginRight: 3 }}
                      onClick={() => handlePrev()}
                    >
                      Back
                    </Button>
                  )}

                  {currentIndex === targets.length - 1 ? (
                    <Button
                      type="button"
                      variant="contained"
                      sx={{ py: 1, paddingX: 6, boxShadow: 0, borderRadius: 2 }}
                      onClick={() => handleSubmission()}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <CircularProgress size={18} sx={{ color: 'white' }} />
                      ) : (
                        <Typography
                          variant="subtitle1"
                          color={theme.palette.background.paper}
                        >
                          Submit
                        </Typography>
                      )}
                    </Button>
                  ) : (
                    <DrogaButton
                      title="Next"
                      type="button"
                      variant="contained"
                      sx={{ paddingX: 6, boxShadow: 0 }}
                      onPress={() => handleNext()}
                    />
                  )}
                </Box>
              </DialogActions>
            </Grid>
          </Grid>
        )}
      </Dialog>
    </React.Fragment>
  );
};

DistributeTarget.propTypes = {
  add: PropTypes.bool,
  onClose: PropTypes.func,
  plan: PropTypes.array,
  plan_id: PropTypes.string,
  targets: PropTypes.array,
  naming: PropTypes.string,
  remainingTarget: PropTypes.number,
  onRefresh: PropTypes.func,
};

export default DistributeTarget;
