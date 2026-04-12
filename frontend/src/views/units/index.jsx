import 'react-toastify/dist/ReactToastify.css';
import React, { useEffect, useState } from 'react';
import { Box, Card, CircularProgress, Divider, Grid, Typography, useTheme, CardContent, TablePagination } from '@mui/material';

import { DotMenu } from 'ui-component/menu/DotMenu';
import { ExcelTemplates } from 'configration/templates';
import { toast, ToastContainer } from 'react-toastify';
import Backend from 'services/backend';
import Fallbacks from 'utils/components/Fallbacks';
import Search from 'ui-component/search';
import AddUnitType from './components/AddUnitType';
import AddUnit from './components/AddUnit';
import PageContainer from 'ui-component/MainPage';
import UnitsTable from './components/UnitsTable';

import EditUnit from './components/EditUnit';
import EditUnitType from './components/EditUnitType';
import GetToken from 'utils/auth-token';
import DrogaCard from 'ui-component/cards/DrogaCard';

import SplitButton from 'ui-component/buttons/SplitButton';
import UploadFile from 'ui-component/modal/UploadFile';
import axios from 'axios';
import hasPermission from 'utils/auth/hasPermission';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

//================================ UNIT MANAGEMENT PAGE=====================
const Units = () => {
  const theme = useTheme();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    last_page: 0,
    total: 0
  });

  const [unitLoading, setUnitLoading] = useState(true);
  const [unitType, setUnitType] = useState([]);
  const [managers, setManagers] = useState([]);
  const [add, setAdd] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [anchorEl, setAnchorEl] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUnitTypeModalOpen, setEditUnitTypeModalOpen] = useState(false);
  const [selectedUnitType, setSelectedUnitType] = useState(null);
  const [search, setSearch] = useState('');
  const [importExcel, setImportExcel] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const AddUnitOptions = ['Add Unit', 'Import From Excel'];
  const templateUrl = ExcelTemplates.unit_data;

  const handleClick = (unitType) => {
    setSelectedUnitType(unitType);
  };

  const handleClose = () => {
    setAnchorEl(false);
    setSelectedUnit(null);
  };

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPagination({ ...pagination, page: 0 });
  };

  const handleFetchingTypes = async () => {
    setUnitLoading(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.types;
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
          setUnitLoading(false);
          setUnitType(response.data);
        } else {
          setUnitLoading(false);
        }
      })
      .catch((error) => {
        setUnitLoading(false);
        toast(error.message);
      });
  };

  const handleFetchingManagers = async () => {
    const token = await GetToken();
    const Api = Backend.api + Backend.employees + `?role=manager`;
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
          setManagers(response.data.data);
        }
      })
      .catch((error) => {
        toast(error.message);
      });
  };

  const handleAddUnitClick = () => {
    setAdd(true);
    handleFetchingTypes();
    handleFetchingManagers();
  };

  const handleUnitModalClose = () => {
    setAdd(false);
  };

  const handleUnitAddition = async (value) => {
    setIsAdding(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.units;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      parent_id: value?.parent_id,
      unit_type_id: value?.type,
      name: value?.name,
      description: value?.description
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setIsAdding(false);
          handleUnitModalClose();
          toast.success(response.data.message);
          handleFetchingUnits();
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

  const handleEditingUnit = async (value) => {
    setIsAdding(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.units + `/` + selectedUnit.id;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      name: value?.name,
      unit_type_id: value?.my_unit_type,
      parent_id: value?.parent_id,
      parent_unit_type_id: value?.type,
      description: value?.description
    };

    fetch(Api, {
      method: 'PATCH',
      headers: header,
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          handleEditModalClose();
          toast.success(response.data.message);
          handleFetchingUnits();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setIsAdding(false);
      });
  };

  const handleTypeAddition = async (value) => {
    setIsAdding(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.types;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      name: value?.name
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setIsAdding(false);
          handleFetchingTypes();
          toast(response.message);
        } else {
          setIsAdding(false);
          toast(response.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
        setIsAdding(false);
      });
  };

  const handleChangePage = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ ...pagination, per_page: parseInt(event.target.value), page: 0 });
  };

  const handleEdit = (unit) => {
    setSelectedUnit(unit);

    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedUnit(null);
  };
  const handleEditUnitType = (unitType) => {
    setSelectedUnitType(unitType);

    setEditUnitTypeModalOpen(true);
    handleClose();
  };
  const handleUpdateUnitType = () => {
    handleFetchingTypes();
  };

  const handleEditUnitTypeModalClose = () => {
    setEditUnitTypeModalOpen(false);
    setSelectedUnitType(null);
  };

  const handleDelete = async (id, type = 'unit') => {
    const token = localStorage.getItem('token');
    const Api = type === 'unit' ? `${Backend.api}${Backend.units}/${id}` : `${Backend.api}${Backend.types}/${id}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(Api, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        const errorMessage = errorResponse.data?.message || 'Failed to delete';
        throw new Error(errorMessage);
      }
      const data = await response.json();

      if (data.success) {
        toast(`${type === 'unit' ? 'Unit' : 'Unit Type'} deleted successfully`);
        if (type === 'unit') {
          handleFetchingUnits();
          handleClose();
        } else {
          handleFetchingTypes();
          handleClose();
        }
      } else {
        throw new Error(data.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error(`Error deleting ${type === 'unit' ? 'unit' : 'unit type'}: ${error.message}`);
    }
  };

  const handleFetchingUnits = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.units + `?page=${pagination.page + 1}&per_page=${pagination.per_page}&search=${search}`;
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
          setData(response.data.data);
          setPagination({
            ...pagination,
            last_page: response.data.last_page,
            total: response.data.total
          });

          setLoading(false);
          setError(false);
        } else {
          setLoading(false);
          setError(false);
        }
      })
      .catch((error) => {
        toast(error.message);
        setError(true);
        setLoading(false);
      });
  };

  const handleUpload = async (file) => {
    const token = localStorage.getItem('token');
    const Api = Backend.api + Backend.unitexcel;
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

  const handleUnitAdd = (index) => {
    if (index === 0) {
      handleAddUnitClick();
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

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingUnits();
    }, 800);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [search]);

  useEffect(() => {
    if (mounted) {
      handleFetchingUnits();
    } else {
      setMounted(true);
    }
  }, [pagination.page, pagination.per_page]);

  useEffect(() => {
    handleFetchingTypes();
  }, []);

  return (
    <PageContainer
      maxWidth="lg"
      title={'Units Management'}
      searchField={
        <Search title="Search units" value={search} onChange={(event) => handleSearchFieldChange(event)} filter={false}></Search>
      }
      rightOption={
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {hasPermission('create:unit') && <SplitButton options={AddUnitOptions} handleSelection={(value) => handleUnitAdd(value)} />}
        </Box>
      }
    >
      <Grid
        container
        sx={{
          borderRadius: 2,
          marginTop: 2
        }}
      >
        <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Grid xs={12} sm={12} md={8} lg={8} xl={8} sx={{ minHeight: '64dvh', margin: 2 }}>
            {loading ? (
              <Box sx={{ padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size={20} />
              </Box>
            ) : error ? (
              <Fallbacks severity="error" title="Server error" description="There is error fetching units" />
            ) : data.length === 0 ? (
              <Fallbacks
                severity="department"
                title="Unit not found"
                description="The list of added units will be listed here"
                sx={{ paddingTop: 6 }}
              />
            ) : (
              <React.Fragment>
                <UnitsTable
                  units={data}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  pagination={pagination}
                />
                <TablePagination
                  component="div"
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  count={pagination.total}
                  rowsPerPage={pagination.per_page}
                  page={pagination.page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </React.Fragment>
            )}
          </Grid>

          <Grid xs={12} sm={12} md={3.6} lg={3.6} xl={3.6} sx={{ paddingTop: 1 }}>
            <DrogaCard>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingX: 1.6,
                  borderColor: theme.palette.grey[300]
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                  Unit Types
                </Typography>

                {hasPermission('create:unit') && (
                  <AddUnitType isAdding={isAdding} handleSubmission={(value) => handleTypeAddition(value)} />
                )}
              </Box>
              <Divider sx={{ borderBottom: 0.4, borderColor: theme.palette.divider, marginY: 1 }} />

              <Box>
                {unitLoading ? (
                  <Box sx={{ padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size={20} />
                  </Box>
                ) : error ? (
                  <Fallbacks severity="error" title="Server error" description="There is error fetching unit type" />
                ) : unitType.length === 0 ? (
                  <Fallbacks
                    severity="department"
                    title="Unit type not found"
                    description="The list of added unit types will be listed here"
                    sx={{ paddingTop: 6 }}
                  />
                ) : (
                  unitType.map((type, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingY: 0.8,
                        paddingX: 2,
                        ':hover': {
                          backgroundColor: theme.palette.grey[50],
                          borderRadius: 2
                        }
                      }}
                    >
                      <Typography variant="body1" color={theme.palette.text.primary} sx={{ textTransform: 'capitalize' }}>
                        {type.name}
                      </Typography>

                      <DotMenu
                        orientation="vertical"
                        onOpen={() => handleClick(type)}
                        onClose={() => handleClose()}
                        onEdit={hasPermission('update:unit') ? () => handleEditUnitType(selectedUnitType) : null}
                        onDelete={hasPermission('delete:unit') ? () => handleDelete(selectedUnitType.id, 'type') : null}
                      />
                    </Box>
                  ))
                )}
              </Box>
            </DrogaCard>
          </Grid>
        </Grid>
      </Grid>

      <AddUnit
        add={add}
        isAdding={isAdding}
        types={unitType}
        unitss={data}
        managers={managers}
        onClose={handleUnitModalClose}
        handleSubmission={(value) => handleUnitAddition(value)}
      />
      <ToastContainer />
      {selectedUnit && (
        <EditUnit
          edit={editModalOpen}
          types={unitType}
          parentUnits={data}
          selectedUnit={selectedUnit}
          isEditing={isAdding}
          onClose={handleEditModalClose}
          handleSubmission={handleEditingUnit}
        />
      )}
      <EditUnitType
        open={editUnitTypeModalOpen}
        unitType={selectedUnitType}
        onClose={handleEditUnitTypeModalClose}
        onUpdate={handleUpdateUnitType}
      />
      <UploadFile
        open={importExcel}
        onClose={handleCloseDialog}
        onUpload={handleUpload}
        uploadProgress={uploadProgress}
        onRemove={() => setUploadProgress(0)}
        templateUrl={templateUrl}
      />
    </PageContainer>
  );
};

export default Units;
