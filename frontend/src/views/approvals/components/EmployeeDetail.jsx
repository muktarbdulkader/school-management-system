import React from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { DetailInfo } from 'views/employees/components/DetailInfo';
import { IconChartDonut, IconGenderMale, IconId, IconMail, IconPhone, IconTie, IconUser } from '@tabler/icons-react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PropTypes from 'prop-types';
import Fallbacks from 'utils/components/Fallbacks';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const EmployeeDetail = ({ employee }) => {
  const theme = useTheme();
  return (
    <React.Fragment>
      <DrogaCard sx={{ minHeight: 400, position: 'relative' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 0.4,
            borderColor: theme.palette.divider,
            paddingBottom: 1.8
          }}
        >
          <Typography variant="h4">Employee Details</Typography>
        </Box>
        {employee ? (
          <Box>
            {employee?.user && <DetailInfo label={'Employee ID'} info={employee?.user?.username} icon={<IconId size={22} />} />}
            {employee?.user && <DetailInfo label={'Full name'} info={employee?.user?.name} icon={<IconUser size={22} />} />}
            {employee?.job_position && (
              <DetailInfo label={'Position'} info={employee?.job_position?.name} icon={<IconChartDonut size={22} />} />
            )}
            {employee?.gender && <DetailInfo label={'Gender'} info={employee?.gender} icon={<IconGenderMale size={22} />} />}
            {employee?.user?.email && <DetailInfo label={'Email'} info={employee?.user?.email} icon={<IconMail size={22} />} />}
            {employee?.user?.phone && <DetailInfo label={'Phone'} info={employee?.user?.phone} icon={<IconPhone size={22} />} />}

            {employee?.user?.role && <DetailInfo label={'Role'} info={employee?.user?.role} icon={<IconTie size={22} />} />}
          </Box>
        ) : !employee ? (
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
        ) : (
          <Fallbacks severity="employee" title={`Employee detials is not found`} description="" sx={{ paddingTop: 6 }} />
        )}
      </DrogaCard>
    </React.Fragment>
  );
};

EmployeeDetail.propTypes = {
  employee: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default EmployeeDetail;
