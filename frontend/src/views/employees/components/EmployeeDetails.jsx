import { Box, Chip, Grid, Typography, useTheme } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Overlay from '../../../assets/images/overlay_4.jpg';
import { formattedDate } from 'utils/function';

const InfoList = ({ label, info }) => {
  const theme = useTheme();
  return (
    <Box sx={{ padding: 1 }}>
      <Typography variant="body2" color={theme.palette.text.secondary} ml={1.6}>
        {label}
      </Typography>
      <Box
        sx={{
          width: 'auto',
          mt: 0.6,

          backgroundColor: theme.palette.grey[50],
          paddingY: 1.2,
          paddingX: 1.6,
          borderRadius: theme.shape.borderRadius
        }}
      >
        <Typography variant="subtitle1" color={theme.palette.text.primary}>
          {info}
        </Typography>
      </Box>
    </Box>
  );
};

const EmployeeDetails = ({ userInfo }) => {
  const theme = useTheme();

  const [profileImage, setProfileImage] = useState('');

  useEffect(() => {
    setProfileImage(userInfo?.user?.profile_image);
  }, []);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            position: 'relative',
            marginBottom: 1.6,
            border: 1,
            height: 100,
            width: 100,
            borderRadius: 60,
            overflow: 'hidden',
            borderColor: theme.palette.grey[400],
            borderStyle: 'dashed',
            textAlign: 'center'
          }}
        >
          <img
            src={profileImage || Overlay}
            alt="Profile"
            height={'94%'}
            width={'94%'}
            style={{ aspectRatio: 1, objectFit: 'cover', borderRadius: 50, margin: 3 }}
          />
        </Box>
      </Box>

      {userInfo?.user?.username && <InfoList label={'Employee ID'} info={userInfo?.user?.username} />}
      {userInfo?.user?.name && <InfoList label={'Full name'} info={userInfo?.user?.name} />}
      {userInfo?.user?.email && <InfoList label={'Email'} info={userInfo?.user?.email} />}
      {userInfo?.user?.phone && <InfoList label={'Phone'} info={userInfo?.user?.phone} />}

      <Grid container>
        <Grid item xs={12} md={6}>
          <InfoList label={'Unit'} info={userInfo?.unit?.unit?.name} />
        </Grid>
        <Grid item xs={12} md={6}>
          <InfoList label={'Position'} info={userInfo?.job_position.name} />
        </Grid>
      </Grid>

      <Box sx={{ padding: 1 }}>
        <Typography variant="body2" color={theme.palette.text.secondary} ml={1.6}>
          Roles
        </Typography>
        <Box
          sx={{
            width: 'auto',
            mt: 0.6,
            backgroundColor: theme.palette.grey[50],
            paddingY: 1.2,
            paddingX: 1.6,
            borderRadius: theme.shape.borderRadius,
            display: 'flex'
          }}
        >
          {userInfo?.user?.roles?.length > 0
            ? userInfo?.user?.roles?.map((role, index) => (
                <Box key={index}>
                  <Chip label={role.name} sx={{ margin: 0.4 }} />
                </Box>
              ))
            : 'N/A'}
        </Box>
      </Box>

      <InfoList label={'Start date'} info={formattedDate(userInfo?.unit?.started_date)} />
    </>
  );
};

export default EmployeeDetails;
