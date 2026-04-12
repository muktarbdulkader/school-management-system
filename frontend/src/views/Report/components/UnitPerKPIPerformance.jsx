import React, { useEffect, useState } from 'react';
import { Grid, TablePagination, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { ExportMenu } from 'ui-component/menu/ExportMenu';
import { handlePerKPIExcelExport } from 'views/Report/components/PerformanceExport';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PerKPIReportTable from 'ui-component/performance/PerKPIReportTable';

const UnitPerKPIPerformance = ({ id, selectedPeriod }) => {
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    const handleFetchingPerKPIPerformance = async () => {
      try {
        setLoading(true);
        const token = await GetToken();
        const Api =
          Backend.api +
          Backend.unitPerKPIPerformance +
          id +
          `?fiscal_year_id=${selectedYear?.id}&id=${selectedPeriod?.id}`;

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
              setData(response.data);
            }
          })
          .catch((error) => {
            toast.warning(error.message);
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (error) {
        toast.error(error.message);
      }
    };

    handleFetchingPerKPIPerformance();
  }, [selectedYear?.id, id, selectedPeriod]);

  return (
    <Grid container sx={{ display: 'flex', justifyContent: 'center' }}>
      <Grid item xs={12}>
        <DrogaCard sx={{ mt: 2 }}>
          <Grid container>
            <Grid
              item
              xs={12}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h4" color="text.primary" ml={2}>
                Per KPI Performance
              </Typography>
              <ExportMenu
                actionButton={true}
                onExcelDownload={() =>
                  handlePerKPIExcelExport(data?.per_kpi || [])
                }
              />
            </Grid>
            <Grid item xs={12} sx={{}}>
              <PerKPIReportTable
                isLoading={loading}
                performance={data?.per_kpi || []}
              />
            </Grid>
          </Grid>
        </DrogaCard>
      </Grid>
    </Grid>
  );
};

export default UnitPerKPIPerformance;
