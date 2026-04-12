import * as React from 'react';
import { useEffect } from 'react';
import { Box, Chip, Grid } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { SET_FISCAL_YEARS, SET_SELECTED_FISCAL_YEAR } from 'store/actions';
import axios from 'axios';
import Stack from '@mui/material/Stack';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import PageContainer from 'ui-component/MainPage';
import AddButton from 'ui-component/buttons/AddButton';
import BudgetYear from './components/BudgetYear';
import AddFiscalYear from './components/AddFiscalYear';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import Fallbacks from 'utils/components/Fallbacks';
import EditFiscalYear from './components/EditFiscalYear';
import DeletePrompt from 'ui-component/modal/DeletePrompt';
import StaticPeriodsComponent from './components/StaticComponents';
import FrequencyDefinition from './components/TargetEvaluationPeriod';
import EvaluationPeriod from './components/EvaluationPeriod';

function Periods() {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const dispatch = useDispatch();

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [fisicalYear, setFiscalYear] = React.useState([]);
  const [showAll, setShowAll] = React.useState(false);
  const [edit, setEdit] = React.useState(false);
  const [selectedFiscalYear, setSelectedFiscalYear] = React.useState(
    selectedYear ? selectedYear?.id : '',
  );
  const [openPeriod, setOpenPeriod] = React.useState(false);
  const [openEvaluation, setOpenEvaluation] = React.useState(false);

  const [toBeEdited, setToBeEdited] = React.useState(null);
  const [toBeDeleted, setToBeDeleted] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleteFiscal, setDeleteFiscal] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [isPeriodLoading, setIsPeriodLoading] = React.useState(false);
  const [periods, setPeriods] = React.useState([]);

  const handleExpanding = (yearID) => {
    if (selectedFiscalYear === yearID) {
      setSelectedFiscalYear('');
    } else {
      setSelectedFiscalYear(yearID);
      handleFetchingDetails(yearID);
    }
    setOpenPeriod(false);
  };

  const handleCloseModal = () => {
    setOpen(false);
  };

  const handleRefreshingHeaderMenu = (data) => {
    dispatch({ type: SET_FISCAL_YEARS, fiscalYears: data.data });
    if (selectedFiscalYear?.id) {
      const selected = data?.data?.find(
        (year) => year.id == selectedFiscalYear?.id,
      );
      if (data.data.length > 0) {
        dispatch({
          type: SET_SELECTED_FISCAL_YEAR,
          selectedFiscalYear: selected,
        });
      }
    } else if (data.data.length > 0) {
      dispatch({
        type: SET_SELECTED_FISCAL_YEAR,
        selectedFiscalYear: data.data[0],
      });
    }
  };

  const handleFiscalYearCreation = async (values) => {
    setSubmitting(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.fiscal_years;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const startDate = new Date(values.start_date);
    const endDate = new Date(values.end_date);

    const data = {
      year: values.year,
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
          toast.success(response.data?.message);
          handleCloseModal();
          handleFetchingFiscalYear(true);
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
  };

  const handleInitEdition = (fiscal) => {
    setToBeEdited(fiscal);
    setEdit(true);
  };

  const handleClosingModal = () => {
    setToBeEdited(null);
    setEdit(false);
  };

  const handleFiscalYearEditing = async (values) => {
    setSubmitting(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.fiscal_years + `/${toBeEdited?.id}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const startDate = new Date(values.start_date);
    const endDate = new Date(values.end_date);

    const data = {
      year: values.year,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
    };

    fetch(Api, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.message);
          setEdit(false);
          handleFetchingFiscalYear(true);
        } else {
          toast.error(response.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleInitDelete = (fiscal) => {
    setToBeDeleted(fiscal);
    setDeleteFiscal(true);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const token = await GetToken();
      const Api = Backend.api + Backend.fiscal_years + `/${toBeDeleted?.id}`;

      fetch(Api, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            toast.success(response.data.message);
            setDeleteFiscal(false);
            handleFetchingFiscalYear(true);
          } else {
            toast.error(response.data?.message);
          }
        })
        .catch((error) => {
          toast.error(error.message);
        })
        .finally(() => {
          setDeleting(false);
        });
    } catch {
      toast.error('There is an error initiating  fiscal year deletion');
    }
  };

  const handleCreatePeriod = () => {
    setOpen(true);
  };

  const handleFetchingFiscalYear = async (createdNew) => {
    try {
      setLoading(true);

      const token = await GetToken();

      const response = await fetch(`${Backend.api + Backend.fiscal_years}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setFiscalYear(result.data.data);
        createdNew && handleRefreshingHeaderMenu(result.data);
      } else {
        toast.error(result.data.message || 'Failed to fetch fiscal year');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchingDetails = async (yearID) => {
    try {
      setIsPeriodLoading(true);

      const token = await GetToken();
      const fiscalYearId = yearID ? yearID : selectedYear?.id;
      const Api =
        Backend.api +
        Backend.getSinglePeriods +
        `?fiscal_year_id=${fiscalYearId}`;
      const response = await fetch(Api, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok) {
        setPeriods(result.data);
      } else {
        toast.error(result.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsPeriodLoading(false);
    }
  };

  useEffect(() => {
    handleFetchingFiscalYear();
  }, []);

  useEffect(() => {
    setSelectedFiscalYear(selectedYear?.id);
    handleFetchingDetails();
    setOpenPeriod(false);
  }, [selectedYear]);

  return (
    <Stack sx={{ width: '100%' }} spacing={4}>
      <PageContainer
        title="Fiscal Years"
        rightOption={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: 2,
              mt: 4,
            }}
          >
            {fisicalYear.length > 1 && (
              <Chip
                label="Show all"
                sx={{
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  paddingX: 2,
                  paddingY: 0.4,
                  marginRight: 3,
                }}
                color="primary"
                variant={showAll ? 'filled' : 'outlined'}
                onClick={() => setShowAll(!showAll)}
              />
            )}
            <AddButton
              title="Add Fiscal Year"
              variant="contained"
              onPress={() => handleCreatePeriod()}
            />
          </Box>
        }
      >
        <Grid container>
          <Grid item xs={12} sx={{ marginX: 2 }}>
            {loading ? (
              <Grid container>
                <Grid
                  item
                  xs={12}
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 8,
                  }}
                >
                  <ActivityIndicator size={20} />
                </Grid>
              </Grid>
            ) : fisicalYear.length === 0 ? (
              <Fallbacks
                severity="fiscal-year"
                title="Fiscal yeat not found"
                description="The list of added fiscal year will be listed here"
                sx={{ paddingTop: 6 }}
              />
            ) : showAll ? (
              fisicalYear.map((year, index) => (
                <BudgetYear
                  key={index}
                  year={year?.year}
                  startDate={year?.start_date}
                  endDate={year?.end_date}
                  expand={year?.id === selectedFiscalYear}
                  onExpand={() => handleExpanding(year.id)}
                  onEdit={() => handleInitEdition(year)}
                  onDelete={() => handleInitDelete(year)}
                >
                  {year?.id === selectedFiscalYear && (
                    <React.Fragment>
                      <StaticPeriodsComponent
                        isLoading={isPeriodLoading}
                        data={periods}
                        fiscalYear={selectedYear && selectedYear}
                        onRefresh={() => handleFetchingDetails()}
                      />
                      {/* <FrequencyDefinition
                        sx={{ marginTop: 2 }}
                        open={openPeriod}
                        setOpen={(value) => setOpenPeriod(value)}
                      />
                      <EvaluationPeriod
                        sx={{ marginTop: 2 }}
                        open={openEvaluation}
                        setOpen={(value) => setOpenEvaluation(value)}
                      /> */}
                    </React.Fragment>
                  )}
                </BudgetYear>
              ))
            ) : (
              fisicalYear.map(
                (year, index) =>
                  year.id === selectedYear.id && (
                    <BudgetYear
                      key={index}
                      year={year?.year}
                      startDate={year?.start_date}
                      endDate={year?.end_date}
                      expand={year?.id === selectedFiscalYear}
                      onExpand={() => handleExpanding(year.id)}
                      onEdit={() => handleInitEdition(year)}
                      onDelete={() => handleInitDelete(year)}
                    >
                      {year?.id === selectedFiscalYear && (
                        <React.Fragment>
                          <StaticPeriodsComponent
                            isLoading={isPeriodLoading}
                            data={periods}
                            fiscalYear={selectedYear && selectedYear}
                            onRefresh={() => handleFetchingDetails()}
                          />

                          {/* <FrequencyDefinition
                            sx={{ marginTop: 2 }}
                            open={openPeriod}
                            setOpen={(value) => setOpenPeriod(value)}
                          />
                          <EvaluationPeriod
                            sx={{ marginTop: 2 }}
                            open={openEvaluation}
                            setOpen={(value) => setOpenEvaluation(value)}
                          /> */}
                        </React.Fragment>
                      )}
                    </BudgetYear>
                  ),
              )
            )}
          </Grid>
        </Grid>
      </PageContainer>

      <AddFiscalYear
        open={open}
        handleCloseModal={() => handleCloseModal()}
        handleSubmission={(values) => handleFiscalYearCreation(values)}
        submitting={submitting}
      />

      {toBeEdited && (
        <EditFiscalYear
          open={edit}
          fiscal={toBeEdited}
          handleCloseModal={() => handleClosingModal()}
          handleSubmission={(values) => handleFiscalYearEditing(values)}
          submitting={submitting}
        />
      )}

      {toBeDeleted && (
        <DeletePrompt
          type="Delete"
          open={deleteFiscal}
          title="Deleting fiscal year"
          description={`Are you sure you want to delete ` + toBeDeleted?.year}
          onNo={() => setDeleteFiscal(false)}
          onYes={() => handleDelete()}
          deleting={deleting}
          handleClose={() => setDeleteFiscal(false)}
        />
      )}
      <ToastContainer />
    </Stack>
  );
}

export default Periods;
