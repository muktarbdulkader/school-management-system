import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
} from '@mui/material';
import { toast } from 'react-toastify';
import DrogaFormModal from 'ui-component/modal/DrogaFormModal';

const EditUser = ({ edit, isUpdating, userData = {}, roles = [], onClose, onSubmit }) => {
  // Local normalized roles: { uuid: string, name: string }
  const [normalizedRoles, setNormalizedRoles] = useState([]);

  // Form state
  const [userDetails, setUserDetails] = useState({
    full_name: '',
    email: '',
    roles: [], // array of uuids
  });

  // Normalize incoming roles prop into objects { uuid, name }
  useEffect(() => {
    const norm = (roles || [])
      .map((r) => {
        if (!r) return null;
        if (typeof r === 'string') {
          return { uuid: r, name: r };
        }
        // object form: try common fields
        return {
          uuid: r.uuid || r.id || r.name || `${r}` /* fallback */,
          name: r.name || r.role || r.id || String(r.uuid || r),
        };
      })
      .filter(Boolean);
    setNormalizedRoles(norm);
  }, [roles]);

  // Populate form when userData or normalizedRoles change
  useEffect(() => {
    const initialName = userData.full_name || userData.name || '';
    const initialEmail = userData.email || '';
    let selected = [];

    if (Array.isArray(userData.roles) && userData.roles.length > 0) {
      selected = userData.roles
        .map((ur) => {
          if (!ur) return null;
          if (typeof ur === 'string') {
            // try to match normalized role by name or uuid
            const match = normalizedRoles.find((r) => r.uuid === ur || r.name === ur);
            return match ? match.uuid : ur;
          }
          // if object role from backend
          return ur.uuid || ur.id || ur.name || null;
        })
        .filter(Boolean);
    }

    setUserDetails({
      full_name: initialName,
      email: initialEmail,
      roles: selected,
    });
  }, [userData, normalizedRoles]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (event) => {
    setUserDetails((prev) => ({ ...prev, roles: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!userDetails.full_name || !userDetails.email) {
      toast.error('Please fill all required fields.');
      return;
    }
    // Send normalized payload (roles as uuids)
    onSubmit(userDetails);
  };

  return (
    <DrogaFormModal
      open={edit}
      title="Edit User"
      handleClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={isUpdating}
    >
      <TextField
        fullWidth
        label="Full Name"
        name="full_name"
        value={userDetails.full_name}
        onChange={handleChange}
        margin="normal"
        required
      />

      <TextField
        fullWidth
        label="Email"
        name="email"
        value={userDetails.email}
        onChange={handleChange}
        margin="normal"
        required
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>Roles</InputLabel>
        <Select
          label="Roles"
          multiple
          value={userDetails.roles}
          onChange={handleRoleChange}
          renderValue={(selected) =>
            normalizedRoles
              .filter((role) => selected.includes(role.uuid))
              .map((role) => role.name)
              .join(', ')
          }
        >
          {normalizedRoles.map((role) => (
            <MenuItem key={role.uuid} value={role.uuid}>
              <ListItemText primary={role.name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </DrogaFormModal>
  );
};

EditUser.propTypes = {
  edit: PropTypes.bool.isRequired,
  isUpdating: PropTypes.bool.isRequired,
  userData: PropTypes.object,
  roles: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default EditUser;
