import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Grid
} from '@mui/material';
import { IconSearch, IconPlus, IconRefresh, IconBell } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import AnnouncementForm from './components/AnnouncementForm';
import { hasPermission, PERMISSIONS } from 'config/rolePermissions';
import { useSelector } from 'react-redux';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const user = useSelector((state) => state.user?.user);
  const userRoles = useSelector((state) => state.user?.user?.roles || []);
  const canCreateAnnouncement = hasPermission(userRoles, PERMISSIONS.CREATE_ANNOUNCEMENT);
  const canDeleteAnnouncement = hasPermission(userRoles, PERMISSIONS.DELETE_ANNOUNCEMENT);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.announcements}${id}/`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok || res.status === 204) { toast.success('Deleted'); fetchAnnouncements(); }
      else toast.error('Failed to delete');
    } catch { toast.error('Error deleting'); }
  };

  const canManage = (announcement) =>
    canDeleteAnnouncement || announcement.created_by?.id === user?.id;

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.announcements}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.data || []);
        toast.success('Announcements loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement?.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer title="Announcements">
      <DrogaCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h3">Announcements</Typography>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<IconRefresh />}
              onClick={fetchAnnouncements}
              disabled={loading}
            >
              Refresh
            </Button>
            {canCreateAnnouncement && (
              <Button
                variant="contained"
                startIcon={<IconPlus />}
                onClick={() => setFormOpen(true)}
              >
                New Announcement
              </Button>
            )}
          </Stack>
        </Stack>

        <TextField
          fullWidth
          placeholder="Search announcements..."
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <ActivityIndicator size={32} />
          </Box>
        ) : filteredAnnouncements.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <IconBell size={48} color="#ccc" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No announcements found
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredAnnouncements.map((announcement) => (
              <Grid item xs={12} key={announcement.id}>
                <Card sx={{ bgcolor: announcement.is_urgent ? '#fff3e0' : 'white' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 1 }}>
                      <Typography variant="h5" fontWeight="bold">
                        {announcement.title}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {announcement.is_urgent && (
                          <Chip label="Urgent" color="error" size="small" />
                        )}
                        {canManage(announcement) && (
                          <Button size="small" color="error" onClick={() => handleDelete(announcement.id)}>
                            Delete
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {announcement.message}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Posted by: {announcement.created_by?.full_name || 'Admin'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(announcement.created_at).format('MMM DD, YYYY HH:mm')}
                      </Typography>
                      {announcement.target_audience && (
                        <Chip 
                          label={announcement.target_audience} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DrogaCard>

      <AnnouncementForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchAnnouncements}
      />
    </PageContainer>
  );
};

export default AnnouncementsPage;
