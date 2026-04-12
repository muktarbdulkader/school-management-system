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
  Paper,
  Chip,
  styled,
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
  MedicalInformation,
  Warning,
  Category,
  Description, // For Complaint tab
  RemoveRedEye, // For Ocular History tab
  History, // For Medical History tab
} from '@mui/icons-material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TabPanel from 'ui-component/tabs/TabPanel';
import PatientTabs from './PatientTabs';

// Styled tabs components (copied from your example)
const AntTabs = styled(Tabs)({
  borderBottom: '1px solid #e8e8e8',
  '& .MuiTabs-indicator': {
    backgroundColor: '#1890ff',
  },
});

const ViewPatients = () => {
  const { state } = useLocation();
  const patient = state || {};
  const [tabValue, setTabValue] = React.useState(0);

  // Helper function to render detail items
  const renderDetail = (icon, label, value) => (
    <Grid item xs={12} sm={6} md={4}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        {React.cloneElement(icon, { color: 'primary' })}
        <Box>
          <Typography variant="subtitle2" color="textSecondary">
            {label}
          </Typography>
          <Typography variant="body1">
            {value || (
              <span style={{ color: '#999', fontStyle: 'italic' }}>
                Not specified
              </span>
            )}
          </Typography>
        </Box>
      </Box>
    </Grid>
  );

  return (
    <PageContainer back={true} title={patient.full_name || 'Patient Details'}>
      <Card
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          boxShadow: '0 8px 16px 0 rgba(0,0,0,0.1)',
          background: 'linear-gradient(to bottom right, #f9f9f9, #ffffff)',
        }}
      >
        <Box display="flex" alignItems="center" mb={3}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 600, color: 'primary.main' }}
          >
            Patient Information
          </Typography>
          {patient.patient_category && (
            <Chip
              label={patient.patient_category}
              color="secondary"
              size="small"
              sx={{ ml: 2, fontWeight: 600 }}
            />
          )}
        </Box>
        <Divider sx={{ mb: 3, borderColor: 'divider' }} />

        <Grid container spacing={3}>
          {/* Patient Photo */}
          <Grid item xs={12} md={3} display="flex" justifyContent="center">
            <Paper elevation={3} sx={{ p: 1, borderRadius: 3 }}>
              <Avatar
                src={patient.patient_picture_url}
                alt={patient.full_name}
                sx={{
                  width: 160,
                  height: 160,
                  fontSize: 60,
                  bgcolor: 'primary.light',
                }}
              >
                {!patient.patient_picture_url && patient.full_name?.charAt(0)}
              </Avatar>
            </Paper>
          </Grid>

          {/* Patient Details */}
          <Grid item xs={12} md={9}>
            <CardContent sx={{ p: 0 }}>
              <Grid container spacing={2}>
                {renderDetail(<Person />, 'Full Name', patient.full_name)}
                {renderDetail(
                  <Fingerprint />,
                  'EMR Number',
                  patient.emr_number,
                )}
                {renderDetail(<Email />, 'Email', patient.email)}
                {renderDetail(<Phone />, 'Phone', patient.phone)}
                {renderDetail(<Transgender />, 'Gender', patient.gender)}
                {renderDetail(
                  <Cake />,
                  'Date of Birth',
                  patient.date_of_birth &&
                    new Date(patient.date_of_birth).toLocaleDateString(),
                )}
                {renderDetail(
                  <Fingerprint />,
                  'National ID',
                  patient.national_id,
                )}
                {renderDetail(
                  <Fingerprint />,
                  'Passport Number',
                  patient.passport_number,
                )}
                {renderDetail(
                  <Category />,
                  'Patient Category',
                  patient.patient_category,
                )}
                {renderDetail(
                  <CreditCard />,
                  'Payment Type',
                  patient.payment_type,
                )}
                {renderDetail(
                  <Home />,
                  'Address',
                  patient.address &&
                    `${patient.address?.wereda}, ${patient.address?.city}, ${patient.address?.country}`,
                )}
              </Grid>
            </CardContent>
          </Grid>
        </Grid>

        {/* Tabs Section */}
        <Box sx={{ width: '100%', mt: 4 }}>
          <PatientTabs patient={patient} />
        </Box>
      </Card>
    </PageContainer>
  );
};

export default ViewPatients;
