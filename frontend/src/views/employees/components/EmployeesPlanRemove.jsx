import { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  TablePagination,
  Box,
  InputLabel,
  TextField,
  DialogActions,
  Button,
} from '@mui/material';
import DrogaCard from 'ui-component/cards/DrogaCard';
import Search from 'ui-component/search';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';

import EmployeePlanRemoveTable from './EmployeePlanRemoveTable';
import DeletePrompt from 'ui-component/modal/DeletePrompt';
import CenteredModal from 'ui-component/modal/CenteredModal';

const EmployeesPlanRemove = () => {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );
  const [selection, setSelection] = useState('employees');
  const [selectedPlanID, setSelectedPlanID] = useState(null);
  const [deleteEmployeesPlan, setDeleteEmployeesPlan] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
  });
  const handleFetchingEmployees = async () => {
    try {
      const token = await GetToken();

      setLoading(true);

      const Api = `${Backend.api}${Backend.findEmployees}?fiscal_year_id=${selectedYear?.id}&page=${pagination.page}&per_page=${pagination.per_page}&search=${search}`;
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, {
        method: 'GET',
        headers,
      });

      const result = await response.json();

      if (response.status === 200) {
        setData(result.data?.data);
        setPagination((prev) => ({ ...prev, total: result.data?.total }));
        setError(false);
      } else {
        setError(false);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchingEmployees();
  }, [pagination.page, pagination.per_page, search]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = await GetToken();
      const Api =
        Backend.api +
        Backend.deleteEmployeesPlan +
        `/${selectedPlanID}` +
        '?fiscal_year_id=' +
        selectedYear?.id;

      const data = {
        note: remark,
      };

      fetch(Api, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          body: JSON.stringify({ remark }),
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            toast.success(response.data.message);
            setTimeout(() => {
              setDeleteEmployeesPlan(false);
              handleFetchingEmployees();
            }, 500);
            setDeleteEmployeesPlan(false);
            handleFetchingEmployees();
          } else {
            toast.info(response.data.message);
          }
        });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };
  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  //  ========== PAGINATION ========START=======

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination((prev) => ({
      ...prev,
      per_page: parseInt(event.target.value, 10),
    }));
  };

  //  ========== PAGINATION ========END=======

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      //   handleStatusClick();
    }, 600);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [search]);

  return (
    <DrogaCard sx={{ mt: 3, pb: 0, minHeight: '400px' }}>
      <Grid
        container
        spacing={2}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Header Section */}
        <Grid item xs={12}>
          <Typography variant="h4">Remove Employees Plan</Typography>
        </Grid>
      </Grid>

      <Grid container mt={2} spacing={2}>
        <Grid item xs={12} sm={12} md={5} lg={5} xl={12}>
          <Search
            value={search}
            onChange={(event) => handleSearchFieldChange(event)}
          />
        </Grid>
      </Grid>

      <Grid container mt={1} spacing={1}>
        <Grid item xs={12}>
          {loading ? (
            <Grid container>
              <Grid
                item
                xs={12}
                sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
              >
                <ActivityIndicator size={20} />
              </Grid>
            </Grid>
          ) : error ? (
            <ErrorPrompt
              title="There is issue getting data"
              message="It might get fixed by refreshing the page"
              size={80}
            />
          ) : data.length === 0 ? (
            <Fallbacks
              severity={selection}
              title={`Please Search ${selection}`}
              description={`The list of ${selection}  will be listed here`}
              size={80}
              sx={{ marginY: 2 }}
            />
          ) : (
            <EmployeePlanRemoveTable
              data={data}
              openDeletePrompt={(planId) => {
                setSelectedPlanID(planId);
                setDeleteEmployeesPlan(true);
              }}
            />
          )}
        </Grid>
        <CenteredModal
          subtitle={
            <Typography
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'red',
                fontWeight: 'bold',
              }}
            >
              <WarningAmberIcon sx={{ mr: 1, color: 'red' }} />
              Please make sure and add a remark before deleting the plan
            </Typography>
          }
          open={showRemarkModal}
          handleClose={() => setShowRemarkModal(false)}
          sx={{ minWidth: { xs: '300px', sm: '340px', md: '520px' } }}
        >
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              setShowRemarkModal(false);
              handleDelete(remark);
            }}
          >
            <InputLabel htmlFor="remark" sx={{ color: '#343', mb: 2, mt: -1 }}>
              Add a remark
            </InputLabel>

            <TextField
              id="remark"
              fullWidth
              multiline
              rows={4}
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              variant="outlined"
              required
            />

            <DialogActions sx={{ pt: 3, pr: 0 }}>
              <Button onClick={() => setShowRemarkModal(false)} color="inherit">
                Cancel
              </Button>

              <Button
                type="submit"
                sx={{
                  minWidth: '140px',
                  py: 1,
                  color: 'white',
                  bgcolor: '#173273',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                Submit
              </Button>
            </DialogActions>
          </Box>
        </CenteredModal>

        {deleteEmployeesPlan && (
          <DeletePrompt
            type="Delete"
            title="Deleting Plan"
            open={deleteEmployeesPlan}
            description={`Are you sure you want to delete the plan`}
            onNo={() => setDeleteEmployeesPlan(false)}
            onYes={() => {
              setDeleteEmployeesPlan(false); // Close delete prompt
              setShowRemarkModal(true); // Open remark modal
            }}
            deleting={deleting}
            handleClose={() => setDeleteEmployeesPlan(false)}
          />
        )}
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {!loading && (
            <TablePagination
              rowsPerPageOptions={[]}
              component="div"
              count={pagination.total}
              rowsPerPage={pagination.per_page}
              page={pagination.page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

export default EmployeesPlanRemove;
