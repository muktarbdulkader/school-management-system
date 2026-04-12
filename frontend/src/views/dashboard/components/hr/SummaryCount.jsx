import React, { useEffect, useState } from 'react';

// project imports
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Grid } from '@mui/material';
import { AnalyticsPie } from 'ui-component/charts/AnalyticsPie';
import { gridSpacing } from 'store/constant';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import InfoCard from 'ui-component/cards/InfoCard';
import InfoCardSkeleton from 'views/dashboard/skeletons/InforCardSkeleton';
import SelectorMenu from 'ui-component/menu/SelectorMenu';

function formatForChart(unitTypeCounts) {
  if (!Array.isArray(unitTypeCounts) || unitTypeCounts.length === 0) {
    return [];
  }

  return unitTypeCounts
    .filter((item) => item && typeof item.type === 'string' && typeof item.count === 'number')
    .map(({ type, count }) => ({
      label: type,
      value: count
    }));
}

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'My Unit', value: 'my_unit' }
];

const SummaryCount = () => {
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState({
    type: 'all'
  });

  const handleFiltering = (event) => {
    const { value, name } = event.target;
    setFilter({ ...filter, [name]: value });
  };

  const handleGettingCountSummary = async (reload) => {
    try {
      reload && setLoading(true);
      const token = await GetToken();
      const Api = Backend.api + Backend.getHrCount + `?fiscal_year_id=${selectedYear?.id}&filter=${filter.type}`;
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
          toast.error(error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    handleGettingCountSummary(true);
  }, [selectedYear?.id, filter.type]);

  return (
    <Grid item xs={11.6}>
      <Grid container>
        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mt: -3, pl: 2 }}>
          <SelectorMenu name="type" options={filterOptions} selected={filter.type} handleSelection={handleFiltering} />
        </Grid>
      </Grid>
      <Grid container spacing={gridSpacing} sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Grid item xs={12} sm={12} md={12} lg={4} xl={4}>
          {loading ? <InfoCardSkeleton /> : <InfoCard detailLabel={'Units'} detailCounts={formatForChart(data?.unit_type_counts)} />}
        </Grid>
        <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
          {loading ? (
            <InfoCardSkeleton hideone={true} />
          ) : (
            <InfoCard
              detailLabel={'Employees'}
              detailCounts={
                data?.total_male_employee
                  ? [
                      { label: 'Male', value: data?.total_male_employee },
                      { label: 'Female', value: data?.total_female_employee }
                    ]
                  : []
              }
            />
          )}
        </Grid>

        <Grid item xs={12} sm={12} md={6} lg={4} xl={3}>
          {loading ? (
            <InfoCardSkeleton hideone={true} hideTotal={true} />
          ) : (
            <AnalyticsPie
              title="By Eligibility"
              chart={{
                series: data.eligible_employee
                  ? [
                      { label: 'Eligible', value: data.eligible_employee },
                      { label: 'Non-Eligible', value: data?.not_eligible_employee }
                    ]
                  : []
              }}
            />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

SummaryCount.propTypes = {};

export default SummaryCount;
