import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  Rating,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const EodDetailModal = ({ open, report, title, onClose }) => {
  const theme = useTheme();
  const handleClose = () => onClose();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          background: theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.common.white,
        }}
      >
        {title}
        <Button
          onClick={handleClose}
          sx={{
            color: theme.palette.common.white,
            minWidth: 'auto',
            padding: '4px',
          }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3, px: 4 }}>
        {report && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Chip
                label={new Date(report.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                color="primary"
                variant="outlined"
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Satisfaction:</Typography>
                <Rating
                  value={parseInt(report.satisfaction)}
                  max={5}
                  readOnly
                  size="small"
                />
              </Box>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom
                >
                  Tasks Completed
                </Typography>
                <Typography variant="body1" paragraph>
                  {report.completed || 'No tasks completed'}
                </Typography>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom
                >
                  Tasks Pending
                </Typography>
                <Typography variant="body1" paragraph>
                  {report.not_completed || 'No pending tasks'}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                gutterBottom
              >
                Challenges Faced
              </Typography>
              <Typography
                variant="body1"
                paragraph
                sx={{
                  backgroundColor: theme.palette.grey[100],
                  padding: 2,
                  borderRadius: 1,
                }}
              >
                {report.challenge_faced || 'No challenges reported'}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                gutterBottom
              >
                Next Actions
              </Typography>
              <Typography
                variant="body1"
                paragraph
                sx={{
                  backgroundColor: theme.palette.grey[100],
                  padding: 2,
                  borderRadius: 1,
                }}
              >
                {report.next_action || 'No next actions planned'}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 4, py: 2 }}>
        <Button
          onClick={handleClose}
          variant="contained"
          color="primary"
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            px: 3,
            py: 1,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EodDetailModal;
