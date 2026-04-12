import * as React from 'react';
import Popover from '@mui/material/Popover';
import {
  IconButton,
  useTheme,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  Box,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';
import { IconCheck, IconPlus } from '@tabler/icons-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Type name is required')
});

export default function AddUnitType({ isAdding, handleSubmission }) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'popover' : undefined;

  const formik = useFormik({
    initialValues: {
      name: ''
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmission(values);
      handleClose();
    }
  });

  return (
    <div >
      <IconButton aria-describedby={id} onClick={handleClick} sx={{ backgroundColor: theme.palette.grey[50] }}>
        <IconPlus size={18} />
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
          sx={{
           '& .MuiPaper-root': {
              backdropFilter: 'blur(10px)', 
              backgroundColor: 'rgba(255, 255, 255, 0.5)', 
              borderRadius: 2,
              boxShadow: theme.shadows[1],
                              },
              }}
      >
        <Box sx={{ padding: 2 }}>
          <Typography variant="subtitle1">New Unit Type</Typography>
          <form noValidate onSubmit={formik.handleSubmit}>
            <FormControl fullWidth error={formik.touched.name && Boolean(formik.errors.name)} sx={{ marginY: 3 }}>
              <InputLabel htmlfor="name">Type name</InputLabel>
              <OutlinedInput id="name" name="name" label="Type name" value={formik.values.name} onChange={formik.handleChange} fullWidth />
              {formik.touched.name && formik.errors.name && (
                <FormHelperText error id="standard-weight-helper-text-name">
                  {formik.errors.name}
                </FormHelperText>
              )}
            </FormControl>

            <Button type="submit" variant="contained" fullWidth sx={{ padding: 1.4, boxShadow: 0 }} disabled={isAdding}>
              {isAdding ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <IconCheck size={18} />}
            </Button>
          </form>
        </Box>
      </Popover>
    </div>
  );
}
