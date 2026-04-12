import React from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import { Box, Typography, useTheme } from '@mui/material';
import { DetailInfo } from 'views/employees/components/DetailInfo';
import { IconBuilding, IconBuildingArch, IconCalendar, IconDirection } from '@tabler/icons-react';
import { formatDate } from 'utils/function';
import PropTypes from 'prop-types';

const UnitInfo = ({ unit }) => {
  const theme = useTheme();
  return (
    <DrogaCard sx={{ backgroundColor: theme.palette.grey[50], minHeight: 200 }}>
      <Box>
        <Typography variant="subtitle1">Unit Info</Typography>
      </Box>

      {unit?.name && <DetailInfo label={'Unit name'} info={unit?.name} icon={<IconBuildingArch size={22} />} />}
      {unit?.unit_type?.name && <DetailInfo label={'Unit type'} info={unit?.unit_type?.name} icon={<IconDirection size={22} />} />}
      {unit?.parent && <DetailInfo label={'Parent Unit'} info={unit?.parent?.name} icon={<IconBuilding size={22} />} />}

      {unit?.created_at && (
        <DetailInfo label={'Creation date'} info={formatDate(unit?.created_at).formattedDate} icon={<IconCalendar size={22} />} />
      )}
    </DrogaCard>
  );
};

UnitInfo.propTypes = {
  unit: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default UnitInfo;
