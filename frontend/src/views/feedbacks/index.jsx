import { useEffect, useState } from 'react';
import PageContainer from 'ui-component/MainPage';
import Search from 'ui-component/search';
import {
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { DotMenu } from 'ui-component/menu/DotMenu';

import FilterEmployees from '../employees/components/FilterEmployees';

import UploadFile from 'ui-component/modal/UploadFile';
import axios from 'axios';
import { ExcelTemplates } from 'configration/templates';
import { useSelector } from 'react-redux';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const templateUrl = ExcelTemplates.employee_data;

const MyEmployees = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const [mounted, setMounted] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    perPage: 10,
    last_page: 0,
    total: 0,
  });

  const [search, setSearch] = useState('');

  const [importExcel, setImportExcel] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleCloseDialog = () => {
    setImportExcel(false);
  };

  const handleUpload = async (file) => {
    const token = localStorage.getItem('token');
    const Api = Backend.api + Backend.employeeExcel;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    };

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(Api, formData, {
        headers: headers,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percent);
        },
      });

      if (response.success) {
        toast.success(response.data.data.message);
      } else {
        toast.success(response.data.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, perPage: event.target.value });
  };

  const handleFetchingEmployees = () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    let Api =
      Backend.api +
      Backend.myTeams +
      `?fiscal_year_id=${selectedYear?.id}&page=${pagination.page + 1}&per_page=${pagination.perPage}&search=${search}`;

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
          setData(response.data.data);
          setPagination({ ...pagination, total: response.data.total });
          setError(false);
        } else {
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingEmployees();
    }, 800);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [search]);

  useEffect(() => {
    if (mounted) {
      handleFetchingEmployees();
    } else {
      setMounted(true);
    }

    return () => {};
  }, [pagination.page, pagination.perPage]);

  return (
    <PageContainer
      title="Employees Feedback"
      searchField={
        <Search
          title="Filter Employees"
          value={search}
          onChange={(event) => handleSearchFieldChange(event)}
          filter={false}
        >
          <FilterEmployees />
        </Search>
      }
    >
      <Grid container padding={2}>
        <Grid item xs={12}>
          <TableContainer
            sx={{
              minHeight: '66dvh',
              border: 0.4,
              borderColor: theme.palette.divider,
              borderRadius: 2,
            }}
          >
            <Table sx={{ minWidth: 650 }} aria-label="Employes table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Job Position</TableCell>
                  <TableCell>Tasks</TableCell>
                  <TableCell>Subtasks</TableCell>
                  <TableCell>Pending Tasks</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                  >
                    <TableCell
                      colSpan={7}
                      sx={{
                        border: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ActivityIndicator size={20} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow sx={{ padding: 4 }}>
                    <TableCell colSpan={7} sx={{ border: 0 }}>
                      <Typography variant="body2">
                        There is error fetching the Employees
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow sx={{ padding: 4 }}>
                    <TableCell colSpan={7} sx={{ border: 0 }}>
                      <Typography variant="body2">
                        Employee not found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.map(
                    (employee, index) => (
                      console.log(employee.employee_id),
                      (
                        <TableRow
                          key={employee.employee_id}
                          sx={{
                            backgroundColor:
                              selectedRow == index
                                ? theme.palette.grey[100]
                                : theme.palette.background.default,
                            ':hover': {
                              backgroundColor: theme.palette.grey[100],
                              color: theme.palette.background.default,
                              cursor: 'pointer',
                              borderRadius: 2,
                            },
                          }}
                          onClick={() =>
                            navigate('/employeesFeedBack/view', {
                              state: {
                                ...employee,
                                employee_id: employee.employee_id,
                              },
                            })
                          }
                        >
                          <TableCell
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              border: 0,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              color={theme.palette.text.primary}
                            >
                              {employee?.name}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ border: 0 }}>
                            {employee?.position ? employee?.position : 'N/A'}
                          </TableCell>
                          <TableCell sx={{ border: 0 }}>
                            {employee?.tasks_count}
                          </TableCell>
                          <TableCell sx={{ border: 0 }}>
                            {employee?.sub_tasks_count}
                          </TableCell>
                          <TableCell sx={{ border: 0 }}>
                            {employee?.pending_tasks_count
                              ? employee?.pending_tasks_count
                              : 'N/A'}
                          </TableCell>

                          <TableCell sx={{ border: 0 }}>
                            <DotMenu
                              onView={() =>
                                navigate('/employeesFeedBack/view', {
                                  state: employee,
                                })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            rowsPerPageOptions={[10, 25, 50, 100]}
            count={pagination.total}
            rowsPerPage={pagination.perPage}
            page={pagination.page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Grid>
      </Grid>

      <UploadFile
        open={importExcel}
        onClose={handleCloseDialog}
        onUpload={(file) => handleUpload(file)}
        uploadProgress={uploadProgress}
        onRemove={() => setUploadProgress(0)}
        templateUrl={templateUrl}
      />

      <ToastContainer />
    </PageContainer>
  );
};

export default MyEmployees;
