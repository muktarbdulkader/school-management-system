import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import Backend from 'services/backend';
import PageContainer from 'ui-component/MainPage';
import PerKPIReportCard from 'ui-component/performance/PerKPIReportCard';
import GetToken from 'utils/auth-token';
import { ExportMenu } from 'ui-component/menu/ExportMenu';
import { handlePerKPIExcelExport } from './PerformanceExport';

const PerKPIPerformanceReport = () => {
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);
  const { state } = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!state.state) {
      navigate(-1);
    }
  }, [state.state]);

  useEffect(() => {
    const handleFetchingPerKPIPerformance = async () => {
      try {
        setLoading(true);
        const token = await GetToken();
        const Api =
          Backend.api +
          Backend.perKPIPerformance +
          `?fiscal_year_id=${selectedYear?.id}&id=${state?.state?.id}&filter_type=${state?.filtered_by}`;

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
  }, [state?.state]);

  return (
    <PageContainer
      back={true}
      title={'Per KPI Performances of ' + state?.state?.name}
      rightOption={<ExportMenu actionButton={true} onExcelDownload={() => handlePerKPIExcelExport(data?.per_kpi || [])} />}
    >
      <Grid container>
        <Grid item xs={12} sx={{ px: 1.6 }}>
          <PerKPIReportCard isLoading={loading} performance={data?.per_kpi || []} />
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default PerKPIPerformanceReport;
