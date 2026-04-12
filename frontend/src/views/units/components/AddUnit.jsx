import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import Backend from 'services/backend';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Unit name is required'),
  parent_id: Yup.string().required('Parent Unit is required'),
  type: Yup.string().required('Unit type is required')
});

import PropTypes from 'prop-types';

const AddUnit = ({ add, isAdding, types, onClose, handleSubmission }) => {
  const [loadingParents, setLoadingParents] = React.useState(false);
  const [parentUnits, setParentUnits] = React.useState([]);

  const formik = useFormik({
    initialValues: {
      name: '',
      parent_id: '',
      unit: null,
      parent_unit_type: null,
      type: '',
      description: ''
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmission(values);
    }
  });

  const handleFetchingUnits = async () => {
    setLoadingParents(true);
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
          setParentUnits(response.data.units);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => setLoadingParents(false));
  };

  React.useEffect(() => {
    if (formik.values.type) {
      handleFetchingUnits();
    }
  }, [formik.values.type]);

  return (
    <React.Fragment>
      <Dialog
        open={add}
        onClose={onClose}
        sx={{
          backdropFilter: 'blur(10px)', // Frosted glass effect
          backgroundColor: 'rgba(255, 255, 255, 0.1)' // Optional: Lightens the backdrop
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 2 }}>
          <DialogTitle variant="h3">Add Unit</DialogTitle>
          <IconButton onClick={onClose}>
            <IconX size={20} />
          </IconButton>
        </Box>

        <form noValidate onSubmit={formik.handleSubmit}>
          <DialogContent>
            <FormControl fullWidth error={formik.touched.name && Boolean(formik.errors.name)} sx={{ marginTop: 3 }}>
              <InputLabel htmlfor="name">Name</InputLabel>
              <OutlinedInput id="name" name="name" label="name" value={formik.values.name} onChange={formik.handleChange} fullWidth />
              {formik.touched.name && formik.errors.name && (
                <FormHelperText error id="standard-weight-helper-text-name">
                  {formik.errors.name}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={formik.touched.type && Boolean(formik.errors.type)} sx={{ marginTop: 3 }}>
              <InputLabel htmlfor="type">Unit type</InputLabel>

              <Select id="type" name="type" label="Unit type" value={formik.values.type} onChange={formik.handleChange}>
                {types.length === 0 ? (
                  <Typography variant="body2" sx={{ padding: 1 }}>
                    Unit type is not found
                  </Typography>
                ) : (
                  types?.map((type, index) => (
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
            <FormControl fullWidth error={formik.touched.parent_unit_type && Boolean(formik.errors.parent_unit_type)} sx={{ marginTop: 3 }}>
              <InputLabel htmlfor="parent_unit_type">Parent Unit type</InputLabel>

              <Select
                id="parent_unit_type"
                name="parent_unit_type"
                label="Parent Unit type"
                value={formik.values.parent_unit_type}
                onChange={formik.handleChange}
              >
                {types.length === 0 ? (
                  <Typography variant="body2" sx={{ padding: 1 }}>
                    Unit type is not found
                  </Typography>
                ) : (
                  types?.map((type, index) => (
                    <MenuItem key={index} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))
                )}
              </Select>

              {formik.touched.parent_unit_type && formik.errors.parent_unit_type && (
                <FormHelperText error id="standard-weight-helper-text-type">
                  {formik.errors.parent_unit_type}
                </FormHelperText>
              )}
            </FormControl>
            <FormControl
              fullWidth
              error={formik.touched.parent_id && Boolean(formik.errors.parent_id)}
              sx={{ marginTop: 3 }}
              disabled={formik?.values?.type === ''}
            >
              <InputLabel htmlfor="unit">Select parent unit</InputLabel>

              <Select id="unit" name="parent_id" label="Select parent unit" value={formik.values.parent_id} onChange={formik.handleChange}>
                {loadingParents ? (
                  <ActivityIndicator size={18} />
                ) : parentUnits.length === 0 ? (
                  <Typography variant="body2" sx={{ padding: 1 }}>
                    Unit is not found
                  </Typography>
                ) : (
                  parentUnits?.map((unit, index) => (
                    <MenuItem key={index} value={unit.id}>
                      {unit.name}
                    </MenuItem>
                  ))
                )}
              </Select>

              {formik.touched.parent_id && formik.errors.parent_id && (
                <FormHelperText error id="standard-weight-helper-text-parent_id">
                  {formik.errors.parent_id}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={formik.touched.description && Boolean(formik.errors.description)} sx={{ marginTop: 3 }}>
              <InputLabel htmlfor="description">Description (optional)</InputLabel>
              <OutlinedInput
                id="description"
                name="description"
                label="Description (optional)"
                value={formik.values.description}
                onChange={formik.handleChange}
                fullWidth
                multiline
                rows={4}
              />
              {formik.touched.description && formik.errors.description && (
                <FormHelperText error id="standard-weight-helper-text-description">
                  {formik.errors.description}
                </FormHelperText>
              )}
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ paddingX: 2 }}>
            <Button variant="" onClick={onClose} sx={{ marginLeft: 10 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ paddingX: 6, boxShadow: 0 }} disabled={isAdding}>
              {isAdding ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Done'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </React.Fragment>
  );
};

AddUnit.propTypes = {
  add: PropTypes.bool.isRequired,
  isAdding: PropTypes.bool.isRequired,
  types: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  handleSubmission: PropTypes.func.isRequired
  };
  


export default AddUnit;
