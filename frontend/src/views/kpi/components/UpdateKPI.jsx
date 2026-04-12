import React from 'react';
import {
  TextField,
  Button,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Box,
  useTheme
} from '@mui/material';
import { useFormik } from 'formik';
import { IconX } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import * as Yup from 'yup';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('KPI Name is required'),
  perspective_type_id: Yup.string().required('Perspective type is required'),
  measuring_unit_id: Yup.string().required('Measuring unit is required'),
  variation_category: Yup.string().required('Variation category is required'),
  calculation_type: Yup.string().required('Calculation type is required')
});

const UpdateKPI = ({
  open,
  selectedKPI,
  handleClose,
  isLoading,
  measuringUnits,
  perspectiveTypes,
  handleSubmission,
  isUpdating,
  variationCategories,
  calculationType
}) => {
  const theme = useTheme();
  const formik = useFormik({
    initialValues: {
      name: selectedKPI?.name,
      perspective_type_id: selectedKPI?.perspective_type?.id,
      measuring_unit_id: selectedKPI?.measuring_unit?.id,
      variation_category: selectedKPI?.variation_category,
      calculation_type: selectedKPI?.calculation_type,
      description: selectedKPI?.description
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmission(values);
    }
  });

  return (
    <Dialog open={open} onClose={handleClose}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingX: 1 }}>
        <DialogTitle variant="h3" color={theme.palette.text.primary}>
          Edit KPI
        </DialogTitle>
        <motion.div
          whileHover={{
            rotate: 90
          }}
          transition={{ duration: 0.3 }}
          style={{ cursor: 'pointer', marginRight: 16 }}
          onClick={handleClose}
        >
          <IconX size="1.4rem" stroke={2} />
        </motion.div>
      </Box>

      {isLoading ? (
        <DialogContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={20} />
        </DialogContent>
      ) : (
        <DialogContent>
          <form onSubmit={formik.handleSubmit}>
            <TextField
              margin="normal"
              fullWidth
              id="name"
              name="name"
              label="KPI name"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />

            <TextField
              fullWidth
              margin="normal"
              id="perspective_type_id"
              name="perspective_type_id"
              label="Perspective Type"
              select
              value={formik.values.perspective_type_id}
              onChange={formik.handleChange}
              error={formik.touched.perspective_type_id && Boolean(formik.errors.perspective_type_id)}
              helperText={formik.touched.perspective_type_id && formik.errors.perspective_type_id}
            >
              {perspectiveTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              margin="normal"
              id="measuring_unit_id"
              name="measuring_unit_id"
              label="Measuring Unit"
              select
              value={formik.values.measuring_unit_id}
              onChange={formik.handleChange}
              error={formik.touched.measuring_unit_id && Boolean(formik.errors.measuring_unit_id)}
              helperText={formik.touched.measuring_unit_id && formik.errors.measuring_unit_id}
            >
              {measuringUnits.map((unit) => (
                <MenuItem key={unit.id} value={unit.id}>
                  {unit.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              margin="normal"
              id="variation_category"
              name="variation_category"
              label="Variation Category"
              select
              value={formik.values.variation_category}
              onChange={formik.handleChange}
              error={formik.touched.variation_category && Boolean(formik.errors.variation_category)}
              helperText={formik.touched.variation_category && formik.errors.variation_category}
            >
              {variationCategories.map((category, index) => (
                <MenuItem key={index} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              margin="normal"
              id="calculation_type"
              name="calculation_type"
              label="Calculation Type"
              select
              value={formik.values.calculation_type}
              onChange={formik.handleChange}
              error={formik.touched.calculation_type && Boolean(formik.errors.calculation_type)}
              helperText={formik.touched.calculation_type && formik.errors.calculation_type}
            >
              {calculationType.map((calculation, index) => (
                <MenuItem key={index} value={calculation}>
                  {calculation}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              margin="normal"
              id="description"
              name="description"
              label="Description (Optional)"
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
            />
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Cancel
              </Button>

              <DrogaButton
                type="submit"
                title={isUpdating ? <ActivityIndicator size={18} sx={{ color: 'white' }} /> : 'Done'}
                sx={{ paddingX: 6 }}
              />
            </DialogActions>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default UpdateKPI;
