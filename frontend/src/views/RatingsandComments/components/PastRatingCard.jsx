import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Rating,
  Tooltip,
} from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { useState } from 'react';

const PastRatingCard = ({ rating }) => {
  const [showFullComment, setShowFullComment] = useState(false);

  // Format the role to be more readable
  const formatRole = (role) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  // Check if comment needs truncation (more than 2 lines)
  const needsTruncation = (comment) => {
    if (!comment) return false;
    // Approximate line count based on character count (adjust as needed)
    return comment.length > 120; // Rough estimate for 2 lines
  };

  return (
    <Card
      sx={{
        mb: 3,
        height: '100%',
        borderRadius: 2,
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0px 6px 14px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box display="flex" alignItems="center">
            <Avatar
              src={rating.avatar}
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
                {rating.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatRole(rating.role)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" mb={2}>
          <Rating value={rating.rating} readOnly size="small" />
          <Typography variant="body2" color="text.secondary" ml={2}>
            Rated on {rating.date}
          </Typography>
        </Box>

        {rating.comment && (
          <Tooltip
            title={needsTruncation(rating.comment) ? rating.comment : ''}
            placement="top"
            arrow
            disableHoverListener={showFullComment}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              // mb={2}
              sx={{
                backgroundColor: 'grey.50',
                p: 2,
                borderRadius: 2,
                fontStyle: 'italic',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: showFullComment ? 'unset' : 1,
                WebkitBoxOrient: 'vertical',
                cursor: needsTruncation(rating.comment) ? 'pointer' : 'default',
                '&:hover': {
                  backgroundColor: needsTruncation(rating.comment)
                    ? 'grey.100'
                    : 'grey.50',
                },
              }}
              onClick={() =>
                needsTruncation(rating.comment) &&
                setShowFullComment(!showFullComment)
              }
            >
              "{rating.comment}"
              {needsTruncation(rating.comment) && !showFullComment && (
                <Box
                  component="span"
                  sx={{
                    color: 'primary.main',
                    fontWeight: '600',
                    ml: 0.5,
                  }}
                >
                  ...
                </Box>
              )}
            </Typography>
          </Tooltip>
        )}
        {/* 
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="text"
            color="primary"
            endIcon={<ChevronRightIcon />}
            sx={{
              p: 0,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            View Details
          </Button>
        </Box> */}
      </CardContent>
    </Card>
  );
};

export default PastRatingCard;
