import React from 'react';
import PageContainer from 'ui-component/MainPage';
import { useLocation } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Divider,
  Grid,
  Box,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Cake,
  Transgender,
  Fingerprint,
  CreditCard,
  Home,
  Category,
} from '@mui/icons-material';
import PatientTabs from './components/PatientTabs';

const ViewVisitPatients = () => {
  const theme = useTheme();
  const { state } = useLocation();
  const visit = state || {};

  // Unified detail item with primary color icons
  const renderDetail = (Icon, label, value) => (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Box
          sx={{
            p: 1,
            bgcolor: 'primary.light',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
          }}
        >
          <Icon
            fontSize="small"
            color="primary"
            sx={{
              color: 'primary.main',
            }}
          />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {value || (
              <span
                style={{
                  color: theme.palette.text.disabled,
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                Not specified
              </span>
            )}
          </Typography>
        </Box>
      </Stack>
    </Grid>
  );

  return (
    <PageContainer
      back={true}
      title={visit.patient?.full_name || 'Patient Details'}
    >
      <Card
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.08)',
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header with primary color gradient */}
        <Box
          display="flex"
          alignItems="center"
          mb={3}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.background.paper} 100%)`,
            p: 2,
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: theme.palette.getContrastText(theme.palette.primary.light),
              zIndex: 1,
            }}
          >
            Patient Profile
          </Typography>
          {visit.patient?.patient_category && (
            <Chip
              label={visit.patient?.patient_category}
              color="primary"
              size="small"
              sx={{
                ml: 2,
                fontWeight: 600,
                boxShadow: theme.shadows[1],
                zIndex: 1,
              }}
            />
          )}
        </Box>

        <Grid container spacing={3} alignItems="flex-start">
          {/* Profile Photo Section */}
          <Grid item xs={12} md={2}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <Avatar
                src={visit.patient?.patient_picture_url}
                alt={visit.patient?.full_name}
                sx={{
                  width: 90,
                  height: 90,
                  fontSize: 36,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: theme.shadows[4],
                  border: `3px solid ${theme.palette.background.paper}`,
                  '&:hover': {
                    transform: 'scale(1.05)',
                    transition: 'transform 0.3s',
                  },
                }}
              >
                {!visit.patient?.patient_picture_url &&
                  visit.patient?.full_name?.charAt(0)}
              </Avatar>
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {visit.patient?.full_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  EMR: {visit.patient?.emr_number}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Details Section with Primary Color Icons */}
          <Grid item xs={12} md={10}>
            <CardContent sx={{ p: 0 }}>
              <Grid container spacing={2}>
                {renderDetail(Person, 'Full Name', visit.patient?.full_name)}
                {renderDetail(
                  Fingerprint,
                  'EMR Number',
                  visit.patient?.emr_number,
                )}
                {renderDetail(Email, 'Email', visit.patient?.email)}
                {renderDetail(Phone, 'Phone', visit.patient?.phone)}
                {renderDetail(Transgender, 'Gender', visit.patient?.gender)}
                {renderDetail(
                  Cake,
                  'Date of Birth',
                  visit.patient?.date_of_birth &&
                    new Date(visit.patient?.date_of_birth).toLocaleDateString(),
                )}
                {renderDetail(
                  Fingerprint,
                  'National ID',
                  visit.patient?.national_id,
                )}
                {renderDetail(
                  Fingerprint,
                  'Passport',
                  visit.patient?.passport_number,
                )}
                {renderDetail(
                  Category,
                  'Category',
                  visit.patient?.patient_category,
                )}
                {renderDetail(
                  CreditCard,
                  'Payment',
                  visit.patient?.payment_type,
                )}
                {renderDetail(
                  Home,
                  'Address',
                  visit.patient?.address &&
                    `${visit.patient?.address?.wereda}, ${visit.patient?.address?.city}`,
                )}
              </Grid>
            </CardContent>
          </Grid>
        </Grid>

        <Box sx={{ width: '100%' }}>
          <PatientTabs patient={visit} />
        </Box>
      </Card>
    </PageContainer>
  );
};

export default ViewVisitPatients;
