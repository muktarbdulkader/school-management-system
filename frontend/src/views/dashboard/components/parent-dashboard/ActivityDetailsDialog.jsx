"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
} from "@mui/material";

export default function ActivityDetailsDialog({ activity, open, onClose }) {
  if (!activity) return null;

  // urgency colors
  const urgencyColors = {
    LOW: { bg: "#0077FF", text: "#fff" },
    MEDIUM: { bg: "#FF7E3E", text: "#fff" },
    HIGH: { bg: "#FF1D86", text: "#fff" },
  };
  const urgencyStyle =
    urgencyColors[activity.urgency?.toUpperCase()] || urgencyColors.LOW;

  const eventDate = new Date(activity.event_date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 2 },
      }}
    >
      <DialogTitle>
        <Typography variant="h4" fontWeight="bold">
          {activity.title}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Urgency + Date row */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Chip
            label={activity.urgency}
            sx={{
              backgroundColor: urgencyStyle.bg,
              color: urgencyStyle.text,
              fontWeight: "bold",
              fontSize: "1rem",
              px: 2,
              py: 1,
            }}
          />
          <Typography variant="h6" color="text.secondary">
            {formattedDate} • {formattedTime}
          </Typography>
        </Box>

        {/* Location */}
        {activity.location && (
          <Typography
            variant="h6"
            color="text.primary"
            gutterBottom
            sx={{ fontWeight: 500 }}
          >
            📍 {activity.location}
          </Typography>
        )}

        {/* Message / description */}
        {activity.message && (
          <Typography
            variant="body1"
            color="text.primary"
            sx={{ mt: 2, fontSize: "1.1rem", lineHeight: 1.6 }}
          >
            {activity.message}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
