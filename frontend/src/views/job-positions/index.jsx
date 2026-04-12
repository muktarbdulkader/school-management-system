import React, { useState, useEffect } from 'react';
import {
  Table,
  Box,
  Grid,
  CardContent,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  useTheme,
  TablePagination
} from '@mui/material';

import { useFormik } from 'formik';
import { toast, ToastContainer } from 'react-toastify';
import { AddJobposition } from './componenets/AddJobposition';
import { DotMenu } from 'ui-component/menu/DotMenu';
import * as Yup from 'yup';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import PageContainer from 'ui-component/MainPage';
import UploadFile from 'ui-component/modal/UploadFile';
import hasPermission from 'utils/auth/hasPermission';
import SplitButton from 'ui-component/buttons/SplitButton';
import Search from 'ui-component/search';
import axios from 'axios';

import UpdateJobPosititon from './componenets/UpdateJopposititon';
import DeletePrompt from 'ui-component/modal/DeletePrompt';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import { IconBriefcase } from '@tabler/icons-react';
import { ExcelTemplates } from 'configration/templates';

const AddJobPositionOptions = ['Add Job Positions', 'Import From Excel'];
const templateUrl = ExcelTemplates.job_positions;

const JobPositionTable = () => {
  const [mounted, setMounted] = useState(false);
  const [jobPositions, setJobPositions] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [update, setUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteUser, setDeleteUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importExcel, setImportExcel] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    last_page: 0,
    total: 0
  });
  const theme = useTheme();

  const handleFetchJobPositions = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const api = Backend.api + Backend.jobposition + `?page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}`;
      const response = await fetch(api, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data?.success) {
        setJobPositions(data.data.data || []);
        setPagination({ ...pagination, last_page: data.data.last_page, total: data.data.total });
      } else {
        toast.error(data?.message || 'Failed to fetch job positions');
      }
    } catch (error) {
      toast.error(error?.message || 'Error fetching job positions');
    } finally {
      setLoading(false);
    }
  };

  const handleEditJobPosition = (values) => {
    setIsUpdating(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authorization token is missing.');
      setIsUpdating(false);
      return;
    }

    const Api = Backend.api + Backend.jobposition + `/${selectedRow?.id || ''}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      name: values.name
    };

    fetch(Api, {
      method: 'PATCH',
      headers: header,
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setIsUpdating(false);
          handleUpdateEmployeeClose();
          handleFetchJobPositions();
        } else {
          setIsUpdating(false);
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        setIsUpdating(false);
        toast.error(error.message);
      });
  };

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  const handleSubmitJobPosition = async (values) => {
    try {
      setLoading(true);
      const token = await GetToken();
      if (!token) {
        throw new Error('No token found');
      }

      const Api = Backend.api + Backend.jobposition;
      const response = await fetch(Api, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: values.name })
      });

      const result = await response.json();

      if (result.success) {
        setJobPositions();
        toast.success(result.data.message);
        handleCloseModal();
        handleFetchJobPositions();
      }
    } catch (error) {
      toast.error(error?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJobPosition = () => {
    setDeleting(true);
    const token = localStorage.getItem('token');
    const Api = Backend.api + Backend.jobposition + '/' + selectedRow.id;

    const headers = {
      Authorization: `Bearer` + token,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    fetch(Api, {
      method: 'DELETE',
      headers: headers
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setDeleting(false);
          setDeleteUser(false);
          toast.success(response.data.message);

          handleFetchJobPositions();
        } else {
          setDeleting(false);
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        setDeleting(false);
        toast.error(error.message);
      });
  };

  const handleRemovejobposition = (job) => {
    setSelectedRow(job);
    setDeleteUser(true);
  };

  const handleUpload = async (file) => {
    const token = localStorage.getItem('token');
    const Api = Backend.api + Backend.JobExcell;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    };

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(Api, formData, {
        headers: headers,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
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

  const handleJobpositionUpdate = (job) => {
    setSelectedRow(job);
    setUpdate(true);
  };

  const handleUpdateEmployeeClose = () => {
    setUpdate(false);
  };

  const handleOpenModal = (job = null, index = null) => {
    setEditIndex(index);
    formik.setValues(job || { name: '' });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditIndex(null);
    formik.resetForm();
  };

  const formik = useFormik({
    initialValues: {
      name: ''
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Job Position name is required')
    }),
    onSubmit: (values) => {
      if (editIndex !== null) {
        handleEditJobPosition(values);
      } else {
        handleSubmitJobPosition(values);
      }
    }
  });

  const handleJobPositionAdd = (index) => {
    if (index === 0) {
      handleOpenModal();
    } else if (index === 1) {
      handleOpenDialog();
    } else {
      alert('We will be implement importing from odoo');
    }
  };

  const handleOpenDialog = () => {
    setImportExcel(true);
  };

  const handleCloseDialog = () => {
    setImportExcel(false);
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: event.target.value, page: 0 });
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchJobPositions();
    }, 800);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [search]);

  useEffect(() => {
    if (mounted) {
      handleFetchJobPositions();
    } else {
      setMounted(true);
    }

    return () => {};
  }, [pagination.page, pagination.per_page]);

  return (
    <PageContainer
      title="Job Positions"
      searchField={
        <Search title="Filter Job Position" value={search} onChange={(event) => handleSearchFieldChange(event)} filter={false} />
      }
      rightOption={
        <Box sx={{ mr: 4 }}>
          {hasPermission('create:jobposition') && (
            <SplitButton options={AddJobPositionOptions} handleSelection={(value) => handleJobPositionAdd(value)} />
          )}
        </Box>
      }
    >
      <Grid container paddingY={2}>
        <Grid item xs={12}>
          <CardContent>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <ActivityIndicator size={20} />
              </Box>
            ) : jobPositions?.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                <IconBriefcase size="3.6rem" stroke="1.2" />
                <Typography variant="h4" color="textSecondary" align="center" marginLeft={2} mt={2}>
                  No job positions entered yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer style={{ border: '1px solid #ddd' }}>
                <Table sx={{ minWidth: 650, borderCollapse: 'collapse' }}>
                  <TableHead>
                    <TableRow>
                      {['Job Position', 'Actions'].map((header) => (
                        <TableCell
                          key={header}
                          sx={{
                            background: theme.palette.grey[100],
                            color: '#000',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            borderBottom: `2px solid ${theme.palette.divider}`,
                            position: 'relative',
                            padding: '12px 16px',
                            '&:not(:last-of-type)': {
                              borderRight: `1px solid ${theme.palette.divider}`
                            }
                          }}
                        >
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jobPositions?.map((job) => (
                      <TableRow
                        key={job.id}
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          borderRadius: 2,
                          '&:nth-of-type(odd)': {
                            backgroundColor: theme.palette.grey[50]
                          },
                          '&:hover': {
                            backgroundColor: theme.palette.grey[100]
                          }
                        }}
                      >
                        <TableCell
                          sx={{
                            border: 0,
                            padding: '12px 16px'
                          }}
                        >
                          {job.name}
                        </TableCell>

                        <TableCell sx={{ border: 0 }}>
                          <DotMenu
                            onEdit={hasPermission('update:jobposition') ? () => handleJobpositionUpdate(job) : null}
                            onDelete={hasPermission('delete:jobposition') ? () => handleRemovejobposition(job) : null}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Grid>
      </Grid>

      {!loading && pagination.total > pagination.per_page && (
        <TablePagination
          component="div"
          rowsPerPageOptions={[10, 25, 50, 100]}
          count={pagination.total}
          rowsPerPage={pagination.per_page}
          page={pagination.page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}

      <AddJobposition
        openModal={openModal}
        loading={loading}
        onClose={handleCloseModal}
        handleSubmission={(value) => handleSubmitJobPosition(value)}
      />
      {selectedRow && (
        <UpdateJobPosititon
          update={update}
          isUpdating={isUpdating}
          JopPositionData={selectedRow}
          onClose={() => handleUpdateEmployeeClose()}
          handleSubmission={(value) => handleEditJobPosition(value)}
          formik={formik}
        />
      )}
      {deleteUser && (
        <DeletePrompt
          type="Delete"
          open={deleteUser}
          title="Removing Employee"
          description={`Are you sure you want to remove ` + selectedRow?.name}
          onNo={() => setDeleteUser(false)}
          onYes={() => handleDeleteJobPosition()}
          deleting={deleting}
          handleClose={() => setDeleteUser(false)}
        />
      )}
      <UploadFile
        open={importExcel}
        onClose={handleCloseDialog}
        onUpload={handleUpload}
        uploadProgress={uploadProgress}
        onRemove={() => setUploadProgress(0)}
        templateUrl={templateUrl}
      />
      <ToastContainer />
    </PageContainer>
  );
};

export default JobPositionTable;
