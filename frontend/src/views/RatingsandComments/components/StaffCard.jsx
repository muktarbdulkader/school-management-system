import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Rating,
  CardActionArea,
} from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';

const StaffCard = ({ staff, onRateClick }) => (
  <Card
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 2,
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.12)',
      },
    }}
  >
    <CardActionArea sx={{ flexGrow: 1 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            src={staff.avatar}
            sx={{
              width: 56,
              height: 56,
              mr: 2,
              border: '2px solid',
              borderColor: 'primary.light',
            }}
          />
          <Box>
            <Typography variant="h6" fontWeight="600">
              {staff.full_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {staff.role}
              {staff.subject && ` • ${staff.subject}`}
            </Typography>
            <Rating value={staff.average_rating} readOnly size="small" />
          </Box>
        </Box>

        {staff.hasRating ? (
          <Box>
            <Box display="flex" alignItems="center" mb={1}>
              <Rating value={staff.average_rating} readOnly size="small" />
              <Typography variant="body2" color="text.secondary" ml={1}>
                {staff.rating}.0
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Rated on {staff.date}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              endIcon={<ChevronRightIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              onClick={() => onRateClick(staff)}
            >
              Update Rating
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              mt: 'auto',
              borderRadius: 2,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
            onClick={() => onRateClick(staff)}
          >
            Rate & Comment
          </Button>
        )}
      </CardContent>
    </CardActionArea>
  </Card>
);

export default StaffCard;
