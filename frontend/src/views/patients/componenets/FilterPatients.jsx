import React, { useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  Typography,
  TextField,
} from '@mui/material';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const FilterPatients = ({ filters, onInputChange, onReset, onSort }) => {
  const [rooms, setRooms] = useState({
    loading: false,
    data: [],
  });

  const [positions, setPositions] = useState({
    loading: false,
    data: [],
  });

  //    ------------- HANDLE GETTING ROOMS --------
  const handleFetchingRooms = async () => {
    setRooms((prev) => ({ ...prev, loading: true }));
    const token = await GetToken();
    const Api = Backend.api + Backend.rooms;
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
          setRooms((prev) => ({ ...prev, data: response.data }));
        }
      })
      .finally(() => {
        setRooms((prev) => ({ ...prev, loading: false }));
      });
  };

  //    ---------- HANDLE GETTING POSITIONS ----------
  const handleFetchingPositions = async () => {
    setPositions((prev) => ({ ...prev, loading: true }));
    const token = await GetToken();
    const Api = Backend.api + Backend.allJobPosition;
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
          setPositions((prev) => ({ ...prev, data: response.data }));
        } else {
          setPositions((prev) => ({ ...prev, loading: false }));
        }
      })
      .finally(() => {
        setPositions((prev) => ({ ...prev, loading: false }));
      });
  };

  useEffect(() => {
    handleFetchingRooms();
    handleFetchingPositions();
  }, []);

  return (
    <Grid container>
      <Grid item xs={12} sx={{ p: 3 }}>
        {/* Gender */}
        <FormControl fullWidth>
          <InputLabel id="gender-label">Gender</InputLabel>
          <Select
            labelId="gender-label"
            label="Gender"
            name="gender"
            value={filters.gender}
            onChange={onInputChange}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
          </Select>
        </FormControl>

        {/* Unit */}
        {/* <FormControl fullWidth sx={{ marginTop: 3 }}>
          <InputLabel id="unit-label">Rooms</InputLabel>

          <Select
            id="rooms"
            name="rooms"
            label="Rooms"
            value={filters.rooms}
            onChange={onInputChange}
          >
            <MenuItem value="All">All</MenuItem>

            {rooms.data.length === 0 ? (
              <Typography variant="body2" sx={{ padding: 1 }}>
                rooms not found
              </Typography>
            ) : (
              rooms.data?.map((room, index) => (
                <MenuItem key={index} value={room.id}>
                  {room.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl> */}

        {/* Full Name */}
        <FormControl fullWidth>
          <TextField
            fullWidth
            label="Full Name"
            name="full_name"
            value={filters.full_name}
            onChange={onInputChange}
            margin="normal"
            required
          />
        </FormControl>

        {/* Eligibility */}
        <FormControl fullWidth sx={{ marginTop: 3 }}>
          <TextField
            fullWidth
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={filters.date_of_birth}
            // onChange={handleChange}
            onChange={onInputChange}
            margin="normal"
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
        </FormControl>
        <FormControl fullWidth sx={{ marginTop: 3 }}>
          <TextField
            fullWidth
            type="date"
            name="date"
            label="Filter by Date"
            value={filters.date}
            onChange={onInputChange}
            InputLabelProps={{ shrink: true }}
          />
        </FormControl>

        {/* Date Created */}
        <FormControl fullWidth sx={{ marginTop: 3 }}>
          <InputLabel id="date-created-label">Date Created</InputLabel>
          <Select
            labelId="date-created-label"
            label="Date Created"
            name="created_at"
            value={filters.created_at}
            onChange={onInputChange}
          >
            <MenuItem value="Asc" onClick={() => onSort('created_at', 'asc')}>
              Asc
            </MenuItem>
            <MenuItem value="Desc" onClick={() => onSort('created_at', 'desc')}>
              Desc
            </MenuItem>
          </Select>
        </FormControl>

        {/* Buttons */}

        <Grid
          container
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 5,
          }}
        >
          <Grid item xs={12}>
            <DrogaButton
              title="Reset"
              variant="text"
              color="primary"
              onPress={onReset}
              fullWidth
              sx={{ backgroundColor: 'grey.50', py: 1.4 }}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default FilterPatients;
