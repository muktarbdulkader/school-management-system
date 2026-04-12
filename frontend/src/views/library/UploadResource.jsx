import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  Paper,
  MenuItem,
  IconButton,
  Divider
} from '@mui/material';
import { IconUpload, IconArrowLeft, IconFile } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const RESOURCE_TYPES = [
  { value: 'document', label: 'Document (PDF, Word, etc.)' },
  { value: 'image', label: 'Image (JPG, PNG, etc.)' },
  { value: 'video', label: 'Video (MP4, etc.)' },
  { value: 'audio', label: 'Audio (MP3, etc.)' },
  { value: 'other', label: 'Other' }
];

const UploadResourcePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'document'
  });
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setLoading(true);
    try {
      const token = await GetToken();
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('resource_type', formData.resource_type);
      data.append('file', file);

      const response = await fetch(`${Backend.api}${Backend.digitalResources}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success('Resource uploaded successfully');
        navigate('/home');
      } else {
        toast.error(result.message || 'Failed to upload resource');
      }
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast.error('Failed to upload resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Upload Resource">
      <DrogaCard>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate('/home')}>
            <IconArrowLeft size={24} />
          </IconButton>
          <Typography variant="h3">Upload Digital Resource</Typography>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter resource title"
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter resource description (optional)"
              multiline
              rows={3}
            />

            <TextField
              fullWidth
              select
              label="Resource Type *"
              value={formData.resource_type}
              onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
            >
              {RESOURCE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                File * ({file ? file.name : 'No file selected'})
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<IconFile size={18} />}
                fullWidth
                sx={{ py: 1.5 }}
              >
                Select File
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={loading ? <ActivityIndicator size={18} /> : <IconUpload size={18} />}
                onClick={handleSubmit}
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Uploading...' : 'Upload Resource'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </DrogaCard>
    </PageContainer>
  );
};

export default UploadResourcePage;
