import React from 'react';
import PropTypes from 'prop-types';
import DrogaCard from 'ui-component/cards/DrogaCard';
import { Box, Button, Typography } from '@mui/material';
import { DetailInfo } from 'views/employees/components/DetailInfo';
import { IconChairDirector, IconId, IconMail, IconPhone, IconUser } from '@tabler/icons-react';
import Fallbacks from 'utils/components/Fallbacks';

const ManagerInfo = ({ unit, changeManager }) => {
  return (
    <DrogaCard sx={{ minHeight: 200 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1">Manager Info</Typography>

        <Button variant="text" sx={{ borderRadius: 2, padding: 1, paddingX: 2 }} onClick={changeManager}>
          {unit?.manager ? 'Change manager' : 'Assign Manager'}
        </Button>
      </Box>

      {unit.manager ? (
        <>
          {unit?.manager?.user?.username && (
            <DetailInfo label={'Employment ID'} info={unit?.manager?.user?.username} icon={<IconId size={22} />} />
          )}

          {unit?.manager?.user?.name && (
            <DetailInfo label={'Manager name'} info={unit?.manager?.user?.name} icon={<IconUser size={22} />} />
          )}

          {unit?.manager?.job_position && (
            <DetailInfo label={'Manager Position'} info={unit?.manager?.job_position?.name} icon={<IconChairDirector size={22} />} />
          )}
          {unit?.manager?.user?.email && (
            <DetailInfo label={'Manager email'} info={unit?.manager?.user?.email} icon={<IconMail size={22} />} />
          )}
          {unit?.manager?.user?.phone && (
            <DetailInfo label={'Manager phone'} info={unit?.manager?.user?.phone} icon={<IconPhone size={22} />} />
          )}
        </>
      ) : (
        <Fallbacks severity="manager" title="The unit has no manager" description="" sx={{ paddingY: 4 }} size={60} />
      )}
    </DrogaCard>
  );
};

ManagerInfo.propTypes = {
  unit: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  changeManager: PropTypes.func
};

export default ManagerInfo;
