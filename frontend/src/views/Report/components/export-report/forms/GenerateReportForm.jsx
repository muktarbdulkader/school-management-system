import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { TextField, Grid, Typography, useTheme, useMediaQuery } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import { IconDownload } from '@tabler/icons-react';
import IsEmployee from 'utils/is-employee';

const GenerateReportForm = ({ month, endpoint }) => {
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);
  const theme = useTheme();
  const smallDevice = useMediaQuery(theme.breakpoints.down('sm'));
  const isEmployee = IsEmployee();

  const [perspective, setPerspectives] = useState({
    loading: false,
    error: false,
    data: []
  });

  const [kpi, setKpis] = useState({
    loading: false,
    error: false,
    data: []
  });

  const [employee, setEmployees] = useState({
    loading: false,
    error: false,
    data: []
  });

  const [units, setUnits] = useState({
    loading: false,
    error: false,
    data: []
  });

  const [search, setSearch] = useState({ perspective: '', kpi: '', employee: '', units: '' });
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [download, setDownload] = useState({
    status: false,
    link: ''
  });

  const formik = useFormik({
    initialValues: { perspective: [], kpi: [], employee: [], units: [] },
    validationSchema: Yup.object().shape({}),
    onSubmit: (values) => {
      handleExporting(values);
    }
  });

  const handleGettingData = async (type, setState, endpoint) => {
    try {
      setDownload((prev) => ({ ...prev, status: false, link: '' }));
      setState((prev) => ({ ...prev, loading: true }));
      const token = await GetToken();
      const Api =
        Backend.api +
        endpoint +
        `?search=${search[type]}&perspective_type_id=${formik.values.perspective.id ? formik.values.perspective.id : ''}`;
      const response = await fetch(Api, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setState({ loading: false, error: false, data: data.data.data });
      } else {
        toast.error(data.data.message);
        setState((prev) => ({ ...prev, loading: false, error: true }));
      }
    } catch (error) {
      toast.error(error.message);
      setState((prev) => ({ ...prev, loading: false, error: true }));
    }
  };

  const debounceSearch = (type, value) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(
      setTimeout(() => {
        setSearch((prev) => ({ ...prev, [type]: value }));
      }, 300)
    );
  };

  const handleExporting = async (values) => {
    setSubmitting(true);
    const token = await GetToken();
    const Api = Backend.api + endpoint + `?fiscal_year_id=${selectedYear?.id}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      fiscal_year_id: selectedYear?.id,
      perspective_type_ids: values.perspective.id ? [values.perspective.id] : null,
      kpi_ids: values.kpi.id ? [values.kpi.id] : null,
      employee_ids: values.employee.id ? [values.employee.id] : null,
      unit_ids: values.units.id ? [values.units.id] : null
    };

    fetch(Api, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setDownload((prev) => ({ ...prev, status: true, link: response.data }));
        } else {
          toast.warning(response.message);
          setDownload((prev) => ({ ...prev, status: false, link: '' }));
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  useEffect(() => {
    if (search.perspective) {
      handleGettingData('perspective', setPerspectives, Backend.perspectiveTypes);
    }
    if (search.kpi) {
      handleGettingData('kpi', setKpis, Backend.kpi);
    }
    if (search.employee) {
      handleGettingData('employee', setEmployees, Backend.getEmployees);
    }
    if (search.units) {
      handleGettingData('units', setUnits, Backend.units);
    }
  }, [search]);

  return (
    <Grid container component="form" onSubmit={formik.handleSubmit} sx={{ pr: 2, height: smallDevice ? '80dvh' : '55dvh' }}>
      <Grid item xs={12} sx={{ position: 'relative', px: 1 }}>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
            <Autocomplete
              options={perspective.data}
              getOptionLabel={(option) => option.name || ''}
              loading={perspective.loading}
              onFocus={() => handleGettingData('perspective', setPerspectives, Backend.perspectiveTypes)}
              onChange={(e, value) => {
                formik.setFieldValue('perspective', value);
                setSearch((prev) => ({ ...prev, perspective: '' }));
              }}
              value={formik.values.perspective}
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Perspectives"
                  variant="outlined"
                  margin="normal"
                  fullWidth
                  value={search.perspective}
                  onChange={(e) => debounceSearch('perspective', e.target.value)}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {perspective.loading ? <ActivityIndicator color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
            <Autocomplete
              options={kpi.data}
              getOptionLabel={(option) => option.name || ''}
              loading={kpi.loading}
              onFocus={() => handleGettingData('kpi', setKpis, Backend.kpi)}
              onChange={(e, value) => {
                formik.setFieldValue('kpi', value);
                setSearch((prev) => ({ ...prev, kpi: '' }));
              }}
              value={formik.values.kpi}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="KPI"
                  variant="outlined"
                  margin="normal"
                  fullWidth
                  value={search.kpi}
                  onChange={(e) => debounceSearch('kpi', e.target.value)}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {kpi.loading ? <ActivityIndicator color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        {!isEmployee && (
          <Grid container spacing={1}>
            <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
              <Autocomplete
                options={employee.data}
                getOptionLabel={(option) => option.user?.name || ''}
                loading={employee.loading}
                onFocus={() => handleGettingData('employee', setEmployees, Backend.getEmployees)}
                onChange={(e, value) => formik.setFieldValue('employee', value)}
                value={formik.values.employee}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Employees"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    value={search.employee}
                    onChange={(e) => debounceSearch('employee', e.target.value)}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {employee.loading ? <ActivityIndicator color="inherit" size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
              <Autocomplete
                options={units.data}
                getOptionLabel={(option) => option.name || ''}
                loading={units.loading}
                onFocus={() => handleGettingData('units', setUnits, Backend.units)}
                onChange={(e, value) => formik.setFieldValue('units', value)}
                value={formik.values.units}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Units"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    value={search.units}
                    onChange={(e) => debounceSearch('units', e.target.value)}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {units.loading ? <ActivityIndicator color="inherit" size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        )}

        {download.status ? (
          <Grid
            container
            spacing={1}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              position: 'absolute',
              bottom: 2,
              right: 4
            }}
          >
            <Grid
              item
              xs={12}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'center', sm: 'center', lg: 'flex-end' }
              }}
            >
              <Typography variant="caption" mb={3}>
                Excel file is ready to be downloaded
              </Typography>
            </Grid>

            <Grid
              container
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexDirection: { xs: 'column-reverse', sm: 'column-reverse', lg: 'row' }
              }}
            >
              <Grid item xs={11.6} sm={11.6} md={11.6} lg={4} xl={4}>
                <DrogaButton
                  type="button"
                  title="Cancel"
                  variant="text"
                  color="primary"
                  fullWidth
                  onPress={() => {
                    setDownload((prev) => ({ ...prev, status: false, link: '' }));
                  }}
                />
              </Grid>

              <Grid item xs={11.6} sm={11.6} md={11.6} lg={4} xl={4}>
                <DrogaButton
                  type="button"
                  icon={<IconDownload size="1rem" style={{ paddingRight: 3 }} />}
                  title="Download file"
                  variant="contained"
                  color="primary"
                  fullWidth
                  component="a"
                  href={download.link}
                  download
                />
              </Grid>
            </Grid>
          </Grid>
        ) : (
          <Grid
            container
            spacing={1}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              position: 'absolute',
              bottom: 2,
              right: 4,
              flexDirection: { xs: 'column-reverse', sm: 'column-reverse', lg: 'row' }
            }}
          >
            <Grid item xs={11.6} sm={11.6} md={11.6} lg={4} xl={4}>
              <DrogaButton
                type="button"
                title="Clear Filter"
                variant="text"
                color="primary"
                fullWidth
                onPress={() => {
                  formik.resetForm();
                  setSearch({ perspective: '', kpi: '', employee: '', units: '' });
                }}
              />
            </Grid>

            <Grid item xs={11.6} sm={11.6} md={11.6} lg={4} xl={4}>
              <DrogaButton
                type="submit"
                title="Generate Excel"
                loading={submitting}
                variant="outlined"
                color="primary"
                fullWidth
                disabled={submitting}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default GenerateReportForm;
