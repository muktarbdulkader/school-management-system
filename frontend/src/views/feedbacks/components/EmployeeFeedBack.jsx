import PropTypes from 'prop-types';
import { Box, Chip, Typography, useTheme } from '@mui/material';
import DrogaCard from 'ui-component/cards/DrogaCard';
import { IconCalendarMonth } from '@tabler/icons-react';
import { formatDate } from 'utils/function';
import CircleIcon from '@mui/icons-material/Circle';

export const EmployeeFeedBack = ({ feed }) => {
  const getTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'weakness':
        return 'error';
      case 'area_of_improvement':
        return 'warning';
      case 'recommendation':
        return 'warning';
      case 'strength':
        return 'success';
      default:
        return 'default';
    }
  };

  const theme = useTheme();

  return (
    <DrogaCard
      sx={{
        my: 1.6,
        padding: 1.6,
        py: 1.2,
        transition: 'all 0.2s ease-in-out',
        ':hover': { backgroundColor: theme.palette.grey[50] },
        cursor: 'pointer',
      }}
    >
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginY: 0.4,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              cursor: 'pointer',
              ':hover': { color: theme.palette.primary.main },
              textAlign: 'justify',
            }}
            color={theme.palette.text.primary}
            mt={1}
          >
            {feed?.text}
          </Typography>
        </Box>

        <Chip
          label={feed?.type}
          color={getTypeColor(feed?.type)}
          variant="outlined"
          icon={<CircleIcon sx={{ fontSize: '10px' }} />}
          sx={{ marginY: 0.8 }}
        />
        {/* <Box sx={{ display: 'flex', alignItems: 'center', marginY: 0.4 }}>
          <Typography variant="caption" color={theme.palette.text.secondary}>
            Frequency
          </Typography>

          <Box
            sx={{
              width: 4.43,
              height: 4.43,
              borderRadius: 2.6,
              backgroundColor: 'gray',
              marginX: 1,
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="caption"
              color={theme.palette.text.secondary}
              mr={1}
            >
              {feed?.frequency?.name}
            </Typography>
          </Box>
        </Box> */}
        {/* <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconCalendarMonth size="1.1rem" stroke="1.4" />
            <Typography variant="caption" sx={{ marginLeft: 1 }}>
              {feed?.created_at
                ? formatDate(feed?.created_at).formattedDate
                : ''}
            </Typography>
          </Box>
        </Box> */}
      </Box>
    </DrogaCard>
  );
};

EmployeeFeedBack.propTypes = {
  feed: PropTypes.shape({
    text: PropTypes.string,
    type: PropTypes.string,
    created_at: PropTypes.string,
    frequency: PropTypes.shape({
      value: PropTypes.string,
      name: PropTypes.string,
    }),
  }),
};
