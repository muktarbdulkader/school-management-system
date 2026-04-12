"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
} from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import { useState } from "react";
import ActivityDetailsDialog from "./ActivityDetailsDialog";
import AnnouncementDetailsModal from '../techer-dashoard/components/AnnouncementDetailsModal';

export default function AllActivitiesDialog({ activities, open, onClose }) {
  const [selectedActivity, setSelectedActivity] = useState(null);

  // urgency colors
  const urgencyColors = {
    LOW: { bg: "#0077FF", text: "#fff" },
    MEDIUM: { bg: "#FF7E3E", text: "#fff" },
    HIGH: { bg: "#FF1D86", text: "#fff" },
  };

  return (
    <>
      {/* Wide activities list dialog */}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg" // wide dialog
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h4" fontWeight="bold">
            All Activities
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ maxHeight: "80vh", overflowY: "auto" }}>
          <List>
            {activities.map((activity) => {
              const eventDate = new Date(activity.event_date);
              const day = eventDate.getDate();
              const urgencyStyle =
                urgencyColors[activity.urgency?.toUpperCase()] ||
                urgencyColors.LOW;

              return (
                <ListItem
                  key={activity.id}
                  sx={{
                    px: 2,
                    py: 2,
                    mb: 1,
                    borderRadius: 2,
                    backgroundColor: urgencyStyle.bg + "12",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: urgencyStyle.bg + "40",
                    },
                  }}
                  onClick={() => setSelectedActivity(activity)} // show details
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        backgroundColor: urgencyStyle.bg,
                        color: urgencyStyle.text,
                        fontWeight: "bold",
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
                          {eventDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          •{" "}
                          {eventDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                        {activity.message && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {activity.message}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ChevronRight sx={{ color: "text.secondary" }} />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity Details Modal */}
      <AnnouncementDetailsModal
        open={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        announcementDetails={selectedActivity}
        loading={false}
      />
    </>
  );
}
