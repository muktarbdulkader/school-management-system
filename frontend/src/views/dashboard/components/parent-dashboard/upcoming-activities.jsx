'use client';

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import { ChevronRight, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useState } from 'react';
import AllActivitiesDialog from './AllActivitiesDialog';
import AnnouncementDetailsModal from '../techer-dashoard/components/AnnouncementDetailsModal';

const truncateText = (text, maxLength = 60) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export default function UpcomingActivities({
  activities,
  onSeeAll,
  onActivityClick,
  clickedDate,
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [allActivitiesOpen, setAllActivitiesOpen] = useState(false);

  // Map urgency values to colors
  const urgencyColors = {
    LOW: { bg: '#0077FF', text: '#fff' }, // Blue
    MEDIUM: { bg: '#FF7E3E', text: '#fff' }, // Orange
    HIGH: { bg: '#FF1D86', text: '#fff' }, // Red
  };

  // Show only 5 unless expanded
  const displayedActivities = expanded ? activities : activities.slice(0, 5);

  return (
    <>
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h3" fontWeight="bold">
              Upcoming Activities
            </Typography>
            <Button
              size="small"
              sx={{ textTransform: 'none' }}
              // onClick={onSeeAll}
              onClick={() => setAllActivitiesOpen(true)}
            >
              See all
            </Button>
          </Box>

          <List sx={{ p: 0 }}>
            {displayedActivities.map((activity) => {
              const eventDate = new Date(activity.event_date);

              const day = eventDate.getDate();
              const formattedDate = eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });

              const formattedTime = eventDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const urgencyStyle =
                urgencyColors[activity.urgency?.toUpperCase()] ||
                urgencyColors.LOW;

              return (
                <ListItem
                  key={activity.id}
                  sx={{
                    px: 0,
                    py: 1.5,
                    pl: 2,
                    mb: 1,
                    backgroundColor: urgencyStyle.bg + '12',
                    borderRadius: 3,
                    cursor: onActivityClick ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: urgencyStyle.bg + '40',
                    },
                  }}
                  onClick={() => setSelectedActivity(activity)}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        backgroundColor: urgencyStyle.bg,
                        color: urgencyStyle.text,
                        fontWeight: 'bold',
                      }}
                    >
                      {day}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {activity.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {formattedDate} • {formattedTime}
                        </Typography>
                        {activity.message && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {truncateText(activity.message)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ChevronRight sx={{ color: 'text.secondary' }} />
                </ListItem>
              );
            })}
          </List>

          {/* Show More / Show Less button if activities > 5 */}
          {activities.length > 5 && (
            <Box display="flex" justifyContent="center" mt={1}>
              <Button
                onClick={() => setExpanded((prev) => !prev)}
                size="small"
                endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                sx={{ textTransform: 'none' }}
              >
                {expanded ? 'Show less' : 'Show more'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
      {/* Activity Details Modal */}
      <AnnouncementDetailsModal
        open={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        announcementDetails={selectedActivity}
        loading={false}
      />
      {/* All Activities Dialog */}
      <AllActivitiesDialog
        activities={activities}
        open={allActivitiesOpen}
        onClose={() => setAllActivitiesOpen(false)}
      />
    </>
  );
}
