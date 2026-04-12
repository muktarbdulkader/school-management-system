import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import { formatDate } from 'utils/function';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';

export const TaskOverview = ({ task }) => {
  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return <PictureAsPdfIcon color="error" />;
    if (mimeType.includes('image')) return <ImageIcon color="primary" />;
    if (mimeType.includes('doc'))
      return <ArticleOutlinedIcon color="primary" />;
    return <DescriptionIcon color="action" />;
  };

  const getFileName = (url) => {
    return url.split('/').pop();
  };

  return (
    <Grid container sx={{ display: 'flex', alignItems: 'flex-start' }}>
      <Grid item xs={12}>
        <Grid container>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Task Name</Typography>
            <Typography variant="subtitle1">{task?.title}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2">Task Created at</Typography>
            <Typography variant="subtitle1">
              {formatDate(task?.created_at).formattedDate}
            </Typography>
          </Grid>
        </Grid>
      </Grid>

      <Grid container>
        <Grid item xs={12}>
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2">KPI</Typography>
            <Typography variant="subtitle1">{task?.plan?.kpi?.name}</Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          {task?.description && (
            <Box>
              <Typography variant="subtitle2">Description</Typography>
              <Typography variant="subtitle1">{task?.description}</Typography>
            </Box>
          )}
        </Grid>

        {/* Attachments Section */}
        <Grid item xs={12}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Attachments</Typography>
            {task?.attachments?.length > 0 ? (
              <List dense sx={{ width: '100%' }}>
                {task.attachments.map((attachment, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="download"
                        href={attachment.url}
                        download={getFileName(attachment.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <DownloadIcon />
                      </IconButton>
                    }
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <ListItemIcon>
                      {getFileIcon(attachment.mime_type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={getFileName(attachment.url)}
                      secondary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mt: 0.5,
                          }}
                        >
                          <Chip
                            label={attachment.size}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {attachment.mime_type}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No attachments available
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

TaskOverview.propTypes = {
  task: PropTypes.object.isRequired,
};
