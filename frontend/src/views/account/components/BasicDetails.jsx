import { Box, Button, Grid, Typography, useTheme } from '@mui/material';
import React, { useEffect, useState } from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import Overlay from '../../../assets/images/overlay_4.jpg';
import { IconCamera, IconUser } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { formattedDate } from 'utils/function';
import Backend from 'services/backend';
import axios from 'axios';
import LinearProgress from 'ui-component/indicators/LinearProgress';

const InfoList = ({ label, info }) => {
  const theme = useTheme();
  return (
    <Box sx={{ padding: 1 }}>
      <Typography variant="subtitle2" color={theme.palette.text.disabled}>
        {label}
      </Typography>
      <Box
        sx={{
          width: 'auto',
          mt: 0.6,
          border: 0.8,
          borderColor: theme.palette.divider,
          paddingY: 1.2,
          paddingX: 1.6,
          borderRadius: theme.shape.borderRadius,
        }}
      >
        <Typography variant="subtitle1" color={theme.palette.text.primary}>
          {info}
        </Typography>
      </Box>
    </Box>
  );
};

const BasicDetails = ({ userInfo }) => {
  const theme = useTheme();

  console.log('userInfo', userInfo);

  const [profileImage, setProfileImage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result);
        handleUploadingProfile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadingProfile = async (image) => {
    const token = localStorage.getItem('token');
    const Api = Backend.auth + Backend.updateProfileImage;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    };

    const formData = new FormData();
    formData.append('profile_image', image);

    const response = await axios.post(Api, formData, {
      headers: headers,
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        setUploadProgress(percent);
      },
    });

    response
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data.message);
          localStorage.setItem('profile-image', response.data?.profile_image);
          setProfileImage(response.data.profile_image);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const handleRemovingProfile = () => {
    const token = localStorage.getItem('token');
    const Api = Backend.auth + Backend.removeProfileImage;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    };

    fetch(Api, {
      method: 'POST',
      headers: headers,
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setProfileImage(null);
          localStorage.removeItem('profile-image');
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  useEffect(() => {
    setProfileImage(userInfo?.user?.profile_image);
  }, []);

  return (
    <DrogaCard sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: theme.palette.primary.light,
            marginRight: 2,
          }}
        >
          <IconUser stroke={1.8} size="1.8rem" />
        </Box>
        <Typography variant="h4" color={theme.palette.text.primary}>
          Basic Details
        </Typography>
      </Box>

      <form>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              position: 'relative',
              marginTop: 3.6,
              marginBottom: 1.6,
              border: 1,
              height: 100,
              width: 100,
              borderRadius: 60,
              overflow: 'hidden',
              cursor: 'pointer',
              '&:hover .overlay': {
                opacity: 1,
              },
              borderColor: theme.palette.grey[400],
              borderStyle: 'dashed',
              textAlign: 'center',
            }}
            onClick={() =>
              document.getElementById('profileImageUpload').click()
            }
          >
            <img
              src={profileImage || Overlay}
              alt="Profile"
              height={'94%'}
              width={'94%'}
              style={{
                aspectRatio: 1,
                objectFit: 'cover',
                borderRadius: 50,
                margin: 3,
              }}
            />

            <Box
              className="overlay"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              }}
            >
              <IconCamera stroke={1.6} size="1.4rem" color="#fff" />
              <Typography sx={{ ml: 1, color: '#fff' }}>Select</Typography>
            </Box>
          </Box>
          {profileImage && (
            <Button
              variant="text"
              sx={{ marginLeft: 2, borderRadius: 2 }}
              onClick={() => handleRemovingProfile()}
            >
              Remove
            </Button>
          )}
        </Box>
        {uploadProgress > 0 && (
          <LinearProgress
            value={uploadProgress}
            sx={{ marginBottom: 2, marginLeft: 1 }}
          />
        )}

        <input
          type="file"
          id="profileImageUpload"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />
      </form>

      {userInfo[0]?.username && (
        <InfoList label={'Employee ID'} info={userInfo[0]?.username} />
      )}
      {userInfo[0]?.full_name && <InfoList label={'Full name'} info={userInfo[0]?.full_name} />}
      {userInfo[0]?.email && <InfoList label={'Email'} info={userInfo[0]?.email} />}
      {userInfo[0]?.phone && <InfoList label={'Phone'} info={userInfo[0]?.phone} />}

      <Grid container>
        <Grid item xs={12} md={6}>
          {/* <InfoList label={'Unit'} info={userInfo?.unit?.unit?.name} /> */}
        </Grid>
        <Grid item xs={12} md={6}>
          {/* <InfoList label={'Position'} info={userInfo?.job_position.name} /> */}
        </Grid>
      </Grid>

      {/* <InfoList
        label={'Start date'}
        info={formattedDate(userInfo?.unit?.created_at)}
      /> */}
    </DrogaCard>
  );
};

export default BasicDetails;
