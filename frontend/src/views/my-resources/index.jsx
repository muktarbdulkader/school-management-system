import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  useTheme
} from '@mui/material';
import { IconDownload, IconFileText, IconSearch, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';

const MyResources = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchResources = async () => {
    try {
      setLoading(true);
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.digitalResources}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setResources(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const filteredResources = resources.filter(resource =>
    resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.resource_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.uploaded_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChipColor = (type) => {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('pdf')) return 'error';
    if (typeLower.includes('video')) return 'success';
    if (typeLower.includes('document')) return 'primary';
    return 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <IconArrowLeft size={24} />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          My Resources
        </Typography>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search resources..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconSearch size={20} />
            </InputAdornment>
          ),
        }}
      />

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!loading && filteredResources.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No resources found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search' : 'Check back later for new resources'}
          </Typography>
        </Box>
      )}

      {/* Resources Grid */}
      {!loading && (
        <Grid container spacing={2}>
          {filteredResources.map((resource) => (
            <Grid item xs={12} md={6} lg={4} key={resource.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: theme.palette.primary.light,
                        color: theme.palette.primary.main,
                        mr: 2,
                      }}
                    >
                      <IconFileText size={24} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        {resource.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Uploaded by {resource.uploaded_by_name || 'Admin'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      size="small"
                      label={resource.resource_type_display || resource.resource_type}
                      color={getChipColor(resource.resource_type)}
                      sx={{ mr: 1 }}
                    />
                    {resource.class_name && (
                      <Chip size="small" label={resource.class_name} variant="outlined" />
                    )}
                  </Box>

                  {resource.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {resource.description.length > 100
                        ? `${resource.description.substring(0, 100)}...`
                        : resource.description}
                    </Typography>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<IconDownload size={18} />}
                    onClick={() => window.open(resource.file, '_blank')}
                  >
                    Download / View
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Summary */}
      {!loading && filteredResources.length > 0 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: theme.palette.background.default, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredResources.length} of {resources.length} resources
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MyResources;
