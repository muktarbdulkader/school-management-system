import { useEffect, useState } from 'react';
import { Box, Grid, Table, TableBody, TableCell, TableHead, TableRow, useTheme } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import { useKPI } from 'context/KPIProvider';
import { useSelector } from 'react-redux';
import Backend from 'services/backend';
import FrequencyMenu from './FrequencyMenu';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import noresult from '../../../../assets/images/no_result.png';
import GetToken from 'utils/auth-token';

const FrequencySelection = () => {
  const theme = useTheme();
  const { selectedKpi, updateKPI } = useKPI();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const SelectFiscalYear = useSelector((state) => state.customization.selectedFiscalYear);

  const handleFrequencySelection = (item, id) => {
    updateKPI(id, { frequency_id: item.id, f_name: item.name, f_value: item.value });
  };

  const handleSettingDefaultFrequency = (data) => {
    const quarter = data.find((item) => item.value == 4);
    if (quarter) {
      selectedKpi.forEach((kpi) => handleFrequencySelection(quarter, kpi.id));
    }
  };

  useEffect(() => {
    const handleFetchingPeriods = async () => {
      const token = await GetToken();
      const Api = Backend.api + Backend.planningFrequiencies + `?fiscal_year_id=${SelectFiscalYear?.id}`;
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
            setData(response.data);
            handleSettingDefaultFrequency(response.data);
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

    handleFetchingPeriods();

    return () => {};
  }, [SelectFiscalYear.id]);

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
        <ErrorPrompt image={noresult} title="Server Error" message="Unable to retrive frequency" />
      ) : (
        <Table sx={{ borderRadius: theme.shape.borderRadius }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 170 }}>KPI Name</TableCell>
              <TableCell sx={{ minWidth: 60 }}>Frequency</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedKpi?.map((kpi, index) => (
              <TableRow key={index}>
                <TableCell>{kpi.name}</TableCell>
                <TableCell>
                  <FrequencyMenu menu={data} selected={kpi?.f_name} onSelect={(menu) => handleFrequencySelection(menu, kpi.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <ToastContainer />
    </Box>
  );
};

export default FrequencySelection;
