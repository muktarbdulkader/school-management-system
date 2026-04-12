import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import { user } from '@nextui-org/react';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Full name is required'),
  gender: Yup.string().required('Unit type is required'),
  email: Yup.string().email().required('Email is required'),
  username: Yup.string().required('Username is required'),
  type: Yup.string().required('Unit type is required'),
  phone: Yup.string().required('Phone number is required'),
  unit: Yup.string().required('Unit is required'),
  job_position_id: Yup.string().required('The employee position is required'),
  start_date: Yup.date().required('Employee start date is required')
});

const UpdateEmployee = ({ update, isUpdating, onClose, EmployeeData, handleSubmission }) => {
  const theme = useTheme();
  const [unitLoading, setUnitLoading] = React.useState(true);
  const [unitType, setUnitType] = React.useState([]);
  const [units, setUnits] = React.useState([]);
  const [roles, setRoles] = React.useState([]);
  const [selectedRoles, setSelectedRoles] = React.useState([]);
  const [roleIds, setRoleIds] = React.useState([]);
  const [positions, setPositions] = React.useState([]);

  const handleRoleSelection = (event, value) => {
    setSelectedRoles(value);

    const addedRole = value.find((role) => !selectedRoles.some((selectedRole) => selectedRole.uuid === role.uuid));
    const removeRole = selectedRoles.find((role) => !value.some((selectedRole) => selectedRole.uuid === role.uuid));

    if (addedRole) {
      setRoleIds((prevRoleIds) => [...prevRoleIds, addedRole.uuid]);
    }
    if (removeRole) {
      setRoleIds((prevRoleIds) => prevRoleIds.filter((id) => id !== removeRole.uuid));
    }
  };

  const getUUIDsFromSelectedRoles = () => {
    return selectedRoles.map((role) => role.uuid);
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      gender: '',
      email: '',
      username: '',
      phone: '',
      type: null,
      unit: '',
      job_position_id: '',
      role: '',
      start_date: ''
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmission(values, getUUIDsFromSelectedRoles());
    }
  });

  const handleFetchingTypes = async () => {
    setUnitLoading(true);
    const token = await GetToken('token');
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

  const handleFetchingUnits = async () => {
    const token = await GetToken();
    const Api = Backend.api + Backend.unitByTypes + formik.values.type;
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
          setUnits(response.data.units);
        }
      })
      .catch((error) => {
        toast(error.message);
      });
  };

  const handleFetchingRoles = async () => {
    const token = localStorage.getItem('token');
    const Api = Backend.auth + Backend.roles;
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
          setRoles(response.data);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast(error.message);
      });
  };

  const handleFetchingPositions = async () => {
    const token = await GetToken();
    const Api = Backend.api + Backend.allJobPosition;
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
          setPositions(response.data);
        }
      })
      .catch((error) => {
        toast(error.message);
      });
  };

  const setFormInitialValues = () => {
    formik.setValues({
      ...formik.values,
      name: EmployeeData?.user?.name,
      gender: EmployeeData?.gender,
      email: EmployeeData?.user?.email,
      username: EmployeeData?.user?.username,
      phone: EmployeeData?.user?.phone,
      type: EmployeeData?.unit?.unit?.unit_type_id,
      unit: EmployeeData?.unit?.unit?.id,
      job_position_id: EmployeeData?.job_position_id,
      start_date: EmployeeData?.unit?.started_date?.split(' ')[0]
    });

    setSelectedRoles(EmployeeData?.user?.roles || []);
  };

  React.useEffect(() => {
    if (formik.values.type) {
      handleFetchingUnits();
    }
  }, [formik.values.type]);

  React.useEffect(() => {
    handleFetchingRoles();
    setFormInitialValues();
    handleFetchingTypes();
    handleFetchingPositions();

    return () => {};
  }, [update]);
  return (
    <React.Fragment>
      <Dialog open={update} onClose={onClose}>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 2,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 2,
            paddingY: 0.6,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <DialogTitle variant="h4" color={theme.palette.text.primary}>
            Edit Employee
          </DialogTitle>
          <IconButton onClick={onClose}>
            <IconX size={20} color={theme.palette.text.primary} />
          </IconButton>
        </Box>

        <form noValidate onSubmit={formik.handleSubmit}>
          <DialogContent>
            <FormControl fullWidth error={formik.touched.name && Boolean(formik.errors.name)}>
              <InputLabel htmlFor="name">Full name</InputLabel>
              <OutlinedInput id="name" name="name" label="Full name" value={formik.values.name} onChange={formik.handleChange} fullWidth />
              {formik.touched.name && formik.errors.name && (
                <FormHelperText error id="standard-weight-helper-text-name">
                  {formik.errors.name}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl error={formik.touched.gender && Boolean(formik.errors.gender)} sx={{ marginLeft: 1.4, marginTop: 2.4 }}>
              <FormLabel id="gender">Gender</FormLabel>
              <RadioGroup
                aria-labelledby="gender"
                name="gender"
                value={formik.values.gender}
                onChange={formik.handleChange}
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-around'
                }}
              >
                <FormControlLabel value="Male" control={<Radio />} label="Male" />
                <FormControlLabel value="Female" control={<Radio />} label="Female" />
              </RadioGroup>
            </FormControl>

            <FormControl fullWidth error={formik.touched.email && Boolean(formik.errors.email)} sx={{ marginTop: 2.4 }}>
              <InputLabel htmlFor="email">Email address </InputLabel>
              <OutlinedInput
                id="email"
                name="email"
                label="Email address"
                value={formik.values.email}
                onChange={formik.handleChange}
                fullWidth
              />
              {formik.touched.email && formik.errors.email && (
                <FormHelperText error id="standard-weight-helper-text-name">
                  {formik.errors.email}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={formik.touched.username && Boolean(formik.errors.username)} sx={{ marginTop: 2.4 }}>
              <InputLabel htmlFor="username">User Name </InputLabel>
              <OutlinedInput
                id="username"
                name="username"
                label="User Name"
                value={formik.values.username}
                onChange={formik.handleChange}
                fullWidth
              />
              {formik.touched.username && formik.errors.username && (
                <FormHelperText error id="standard-weight-helper-text-name">
                  {formik.errors.username}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={formik.touched.phone && Boolean(formik.errors.phone)} sx={{ marginTop: 3 }}>
              <InputLabel htmlFor="phone">Phone number</InputLabel>
              <OutlinedInput
                id="phone"
                name="phone"
                label="Phone number"
                value={formik.values.phone}
                onChange={formik.handleChange}
                fullWidth
              />
              {formik.touched.phone && formik.errors.phone && (
                <FormHelperText error id="standard-weight-helper-text-phone">
                  {formik.errors.phone}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={formik.touched.type && Boolean(formik.errors.type)} sx={{ marginTop: 3 }}>
              <InputLabel htmlFor="type">Unit type</InputLabel>

              <Select id="type" name="type" label="Unit type" value={formik.values.type} onChange={formik.handleChange}>
                {unitLoading ? (
                  <ActivityIndicator size={20} />
                ) : unitType.length == 0 ? (
                  <Typography variant="body2" sx={{ padding: 1 }}>
                    Unit type is not found
                  </Typography>
                ) : (
                  unitType?.map((type, index) => (
                    <MenuItem key={index} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))
                )}
              </Select>

              {formik.touched.type && formik.errors.type && (
                <FormHelperText error id="standard-weight-helper-text-type">
                  {formik.errors.type}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl
              fullWidth
              error={formik.touched.unit && Boolean(formik.errors.unit)}
              sx={{ marginTop: 3 }}
              disabled={formik?.values?.type == null}
            >
              <InputLabel htmlFor="unit">Unit</InputLabel>

              <Select id="unit" name="unit" label="Unit" value={formik.values.unit} onChange={formik.handleChange}>
                {units.length === 0 ? (
                  <Typography variant="body2" sx={{ padding: 1 }}>
                    Unit not found
                  </Typography>
                ) : (
                  units?.map((unit, index) => (
                    <MenuItem key={index} value={unit.id}>
                      {unit.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <Autocomplete
              id="roles"
              multiple
              options={roles || []}
              getOptionLabel={(option) => option?.name || ''}
              value={selectedRoles}
              onChange={handleRoleSelection}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => <Chip className="roles-chip" label={option?.name || ''} {...getTagProps({ index })} />)
              }
              fullWidth
              renderInput={(params) => <TextField {...params} label="Select Roles" variant="outlined" />}
              sx={{ marginTop: 4 }}
            />

            <FormControl
              fullWidth
              error={formik.touched.job_position_id && Boolean(formik.errors.job_position_id)}
              sx={{ marginTop: 3 }}
              disabled={formik?.values?.job_position_id == null}
            >
              <InputLabel id="position-label">Position</InputLabel>
              <Select
                id="position"
                name="job_position_id"
                label="Position"
                value={formik.values.job_position_id}
                onChange={formik.handleChange}
                labelId="position-label"
              >
                {positions.length === 0 ? (
                  <Typography variant="body2" sx={{ padding: 1 }}>
                    Position not found
                  </Typography>
                ) : (
                  positions.map((position) => (
                    <MenuItem key={position.id} value={position.id}>
                      {position.name}
                    </MenuItem>
                  ))
                )}
              </Select>
              {formik.touched.job_position_id && formik.errors.job_position_id ? (
                <FormHelperText>{formik.errors.job_position_id}</FormHelperText>
              ) : null}
            </FormControl>

            <FormControl fullWidth error={formik.touched.phone && Boolean(formik.errors.phone)} sx={{ marginTop: 3 }}>
              <InputLabel htmlFor="start_date" shrink={true}>
                Start Date
              </InputLabel>
              <OutlinedInput
                id="start_date"
                name="start_date"
                label="Start Date"
                type="date"
                value={formik.values.start_date}
                onChange={formik.handleChange}
                fullWidth
              />
              {formik.touched.start_date && formik.errors.start_date && (
                <FormHelperText error id="standard-weight-helper-text-start_date">
                  {formik.errors.start_date}
                </FormHelperText>
              )}
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ paddingX: 2, marginBottom: 2 }}>
            <Button onClick={onClose} sx={{ marginLeft: 10 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ paddingX: 6, boxShadow: 0 }} disabled={isUpdating}>
              {isUpdating ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Done'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </React.Fragment>
  );
};

export default UpdateEmployee;
