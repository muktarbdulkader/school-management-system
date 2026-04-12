import { useCallback, useEffect, useState } from 'react';
import { Box, Chip, Grid, InputBase, Table, TableBody, TableCell, TableHead, TableRow, useTheme } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import { useKPI } from 'context/KPIProvider';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import noresult from '../../../../assets/images/no_result.png';
import GetToken from 'utils/auth-token';

const KPISelection = ({ isUpdate, amending }) => {
  const theme = useTheme();
  const { selectedKpi, selectedPerspective, selectedObjective, handleValueSelection, handleValueRemoval, addOrRemoveKPI, updateKPI } =
    useKPI();

  const [mounted, setMounted] = useState(false);
  const [perspectiveLoading, setPerspectiveLoading] = useState(true);
  const [perspectiveData, setPerspectiveData] = useState([]);

  const [objectiveLoading, setObjectiveLoading] = useState(false);
  const [objectiveData, setObjectiveData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState(' ');

  const handlePerspectiveSelection = (event, newValue) => {
    const newPerspective = newValue;
    handleValueSelection('perspective', newPerspective);
  };

  const handleObjectiveSelection = (event, newValue) => {
    const newObjective = newValue;
    handleValueSelection('objective', newObjective);
  };

  const handleSelection = (event, newValue) => {
    const newlySelectedKpis = newValue;
    const previouslySelectedKpis = selectedKpi;

    const addedKpis = newlySelectedKpis.filter((kpi) => !previouslySelectedKpis.some((existingKpi) => existingKpi.id === kpi.id));
    const removedKpis = previouslySelectedKpis.filter((kpi) => !newlySelectedKpis.some((newKpi) => newKpi.id === kpi.id));

    addedKpis.forEach((kpi) => addOrRemoveKPI(kpi));
    removedKpis.forEach((kpi) => addOrRemoveKPI(kpi));
  };

  const handleParentWeightChange = (event, id) => {
    const newWeight = event.target.value;
    updateKPI(id, { parent_weight: newWeight });
  };

  const handleWeightChange = (event, id) => {
    const newWeight = event.target.value;
    updateKPI(id, { weight: newWeight });
  };

  const handleTargetChange = (event, id) => {
    const newTarget = event.target.value;
    updateKPI(id, { total_target: newTarget });
  };

  const handleGettingPerspectives = async () => {
    try {
      setPerspectiveLoading(true);
      const token = await GetToken();
      const Api = Backend.api + Backend.perspectiveTypes;
      const response = await fetch(Api, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setPerspectiveData(data.data.data);
      } else {
        toast.error(data.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPerspectiveLoading(false);
    }
  };

  const handlePerspectiveRemoval = () => {
    handleValueRemoval('perspective');
    setObjectiveData([]);
  };

  const handleObjectiveRemoval = () => {
    handleValueRemoval('objective');
  };

  const handleGettingObjectives = useCallback(async () => {
    try {
      setObjectiveLoading(true);
      const token = await GetToken();
      const Api = Backend.api + Backend.getObjectiveByPerspectives + selectedPerspective?.id;
      const response = await fetch(Api, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setObjectiveData(data?.data);
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setObjectiveLoading(false);
    }
  }, [selectedPerspective?.id]);

  useEffect(() => {
    handleGettingPerspectives();
  }, []);

  useEffect(() => {
    if (mounted || selectedPerspective?.id) {
      handleGettingObjectives();
    } else {
      setMounted(true);
    }
  }, [selectedPerspective?.id]);

  useEffect(() => {
    const handleFetchingKPI = async () => {
      const token = await GetToken();
      const Api = Backend.api + Backend.kpi + `?search=${search}&perspective_type_id=${selectedPerspective?.id}`;
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
            setLoading(false);
            setError(false);
          } else {
            setLoading(false);
            setError(false);
          }
        })
        .catch((error) => {
          toast.error(error.message);
          setError(true);
          setLoading(false);
        });
    };

    const delayDebounceFn = setTimeout(() => {
      if (search) {
        handleFetchingKPI();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedPerspective?.id]);

  return (
    <Box>
      {loading ? (
        <Grid container>
          <Grid
            item
            xs={12}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8
            }}
          >
            <ActivityIndicator size={20} />
          </Grid>
        </Grid>
      ) : error ? (
        <ErrorPrompt image={noresult} title="Server Error" message="Unable to retrive kpi" />
      ) : (
        <>
          {!isUpdate && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Autocomplete
                id="perspective-list"
                options={perspectiveData}
                getOptionLabel={(option) => option.name}
                value={selectedPerspective}
                onChange={(event, newValue, reason) => {
                  handlePerspectiveSelection(event, newValue);
                  if (reason === 'clear') {
                    handlePerspectiveRemoval();
                  }
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => <Chip key={index} label={option.name} {...getTagProps({ index })} />)
                }
                loading={perspectiveLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select a perspective"
                    variant="outlined"
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {perspectiveLoading ? <ActivityIndicator size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                fullWidth
                sx={{ marginBottom: 3 }}
              />

              <Autocomplete
                id="objective-list"
                options={objectiveData}
                getOptionLabel={(option) => option.name}
                value={selectedObjective}
                onChange={(event, newValue, reason) => {
                  handleObjectiveSelection(event, newValue);
                  if (reason === 'clear') {
                    handleObjectiveRemoval();
                  }
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => <Chip key={index} label={option.name} {...getTagProps({ index })} />)
                }
                loading={objectiveLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Objective"
                    variant="outlined"
                    onChange={(e) => setSearch(e.target.value)}
                    helperText={!selectedPerspective && 'You should select perspective first'}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {objectiveLoading ? <ActivityIndicator size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                fullWidth
                sx={{ marginBottom: 3 }}
                disabled={!selectedPerspective}
              />

              <Autocomplete
                id="kpi-list"
                multiple
                options={data}
                getOptionLabel={(option) => option.name}
                value={selectedKpi}
                onChange={handleSelection}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => <Chip key={index} label={option.name} {...getTagProps({ index })} />)
                }
                loading={loading}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select a KPI"
                    variant="outlined"
                    onChange={(e) => setSearch(e.target.value)}
                    helperText={!selectedPerspective?.id && 'You should select perspective and objective first'}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading ? <ActivityIndicator size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                disableClearable
                disabled={!selectedPerspective?.id}
              />
            </Box>
          )}

          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 130 }}>KPI Name</TableCell>
                {amending && <TableCell sx={{ minWidth: 60 }}>Parent Weight(%)</TableCell>}
                <TableCell sx={{ minWidth: 60 }}>Weight(%)</TableCell>
                {!amending && <TableCell sx={{ minWidth: 100 }}>Measured by</TableCell>}
                <TableCell sx={{ minWidth: 120 }}>Target</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedKpi?.map((kpi, index) => (
                <TableRow key={index}>
                  <TableCell>{kpi.name}</TableCell>

                  {amending && (
                    <TableCell>
                      <InputBase
                        sx={{ p: 0.5, border: 1, borderRadius: 2, borderColor: theme.palette.primary.main }}
                        value={kpi.parent_weight}
                        onChange={(event) => handleParentWeightChange(event, kpi.id)}
                        inputProps={{ 'aria-label': 'parent weight' }}
                        type="number"
                      />
                    </TableCell>
                  )}

                  <TableCell>
                    <InputBase
                      sx={{ p: 0.5, border: 1, borderRadius: 2, borderColor: theme.palette.primary.main }}
                      value={kpi.weight}
                      onChange={(event) => handleWeightChange(event, kpi.id)}
                      inputProps={{ 'aria-label': 'weight' }}
                      type="number"
                    />
                  </TableCell>

                  {!amending && <TableCell sx={{ textTransform: 'capitalize' }}>{kpi.mu}</TableCell>}
                  <TableCell>
                    <InputBase
                      sx={{ p: 0.5, border: 1, borderRadius: 2, borderColor: theme.palette.primary.main }}
                      value={kpi.total_target}
                      onChange={(event) => handleTargetChange(event, kpi.id)}
                      inputProps={{ 'aria-label': 'target' }}
                      type="number"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
      <ToastContainer />
    </Box>
  );
};

export default KPISelection;
