import React, { useEffect, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, Grid, Typography } from '@mui/material';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const FilterEmployees = ({ filters, onInputChange, onReset, onSort }) => {
  const [units, setUnits] = useState({
    loading: false,
    data: []
  });

  const [positions, setPositions] = useState({
    loading: false,
    data: []
  });

  //    ------------- HANDLE GETTING UNITS --------
  const handleFetchingUnits = async () => {
    setUnits((prev) => ({ ...prev, loading: true }));
    const token = await GetToken();
    const Api = Backend.api + Backend.allUnits;
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
          setUnits((prev) => ({ ...prev, data: response.data }));
        }
      })
      .finally(() => {
        setUnits((prev) => ({ ...prev, loading: false }));
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
      'Content-Type': 'application/json'
    };

    fetch(Api, {
      method: 'GET',
      headers: header
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
    handleFetchingUnits();
    handleFetchingPositions();
  }, []);

  return (
    <Grid container>
      <Grid item xs={12} sx={{ p: 3 }}>
        {/* Gender */}
        <FormControl fullWidth>
          <InputLabel id="gender-label">Gender</InputLabel>
          <Select labelId="gender-label" label="Gender" name="gender" value={filters.gender} onChange={onInputChange}>
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
          </Select>
        </FormControl>

        {/* Unit */}
        <FormControl fullWidth sx={{ marginTop: 3 }}>
          <InputLabel id="unit-label">Unit</InputLabel>

          <Select id="unit" name="unit" label="Unit" value={filters.unit} onChange={onInputChange}>
            <MenuItem value="All">All</MenuItem>

            {units.data.length === 0 ? (
              <Typography variant="body2" sx={{ padding: 1 }}>
                Unit not found
              </Typography>
            ) : (
              units.data?.map((unit, index) => (
                <MenuItem key={index} value={unit.id}>
                  {unit.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {/* Position */}
        <FormControl fullWidth sx={{ marginTop: 3 }}>
          <InputLabel id="position-label">Position</InputLabel>
          <Select labelId="position-label" label="Position" name="position" value={filters.job_position} onChange={onInputChange}>
            <MenuItem value="All">All</MenuItem>

            {positions.loading ? (
              <ActivityIndicator size={14} />
            ) : positions.data.length === 0 ? (
              <Typography variant="body2" sx={{ padding: 1 }}>
                position not found
              </Typography>
            ) : (
              positions.data?.map((position, index) => (
                <MenuItem key={index} value={position.id}>
                  {position.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {/* Eligibility */}
        <FormControl fullWidth sx={{ marginTop: 3 }}>
          <InputLabel id="eligibility-label">Eligibility</InputLabel>
          <Select labelId="eligibility-label" label="Eligibility" name="eligibility" value={filters.eligibility} onChange={onInputChange}>
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Eligible">Eligible</MenuItem>
            <MenuItem value="Ineligible">Ineligible</MenuItem>
          </Select>
        </FormControl>

        {/* Date Created */}
        <FormControl fullWidth sx={{ marginTop: 3 }}>
          <InputLabel id="date-created-label">Date Created</InputLabel>
          <Select labelId="date-created-label" label="Date Created" name="created_at" value={filters.created_at} onChange={onInputChange}>
            <MenuItem value="Asc" onClick={() => onSort('created_at', 'asc')}>
              Asc
            </MenuItem>
            <MenuItem value="Desc" onClick={() => onSort('created_at', 'desc')}>
              Desc
            </MenuItem>
          </Select>
        </FormControl>

        {/* Buttons */}

        <Grid container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 5 }}>
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

export default FilterEmployees;
