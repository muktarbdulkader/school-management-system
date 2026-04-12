import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Card,
  CardContent,
  Divider,
  Rating,
} from "@mui/material";

const StudentRatingsPopup = ({ open, onClose, student }) => {
  if (!student) return null;

  // Show the most recent rating (last item in array)
  const recentRating =
    student.ratings && student.ratings.length > 0
      ? student.ratings[0] // or student.ratings.at(-1) if backend isn't sorted
      : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Header */}
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Avatar
            src={"/placeholder.svg?height=40&width=40"}
            sx={{ width: 48, height: 48, mr: 2 }}
          />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {student.student_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Most Recent Feedback
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent dividers>
        {recentRating ? (
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              bgcolor: "#F9FAFB",
              boxShadow: "none",
            }}
          >
            <CardContent>
              {/* Category */}
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {recentRating.category || "General"}
              </Typography>

              {/* Rating Stars */}
              <Box display="flex" alignItems="center" mb={1}>
                <Rating
                  value={recentRating.rating || 0}
                  precision={0.5}
                  readOnly
                  size="small"
                />
                <Typography variant="body2" color="text.secondary" ml={1}>
                  {recentRating.rating}/5
                </Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* Description */}
              <Typography variant="body2" color="text.secondary" mb={4}>
                {recentRating.description || "No comment provided."}
              </Typography>

              {/* Date */}
              <Typography variant="caption" color="text.secondary" align="right" display="block">
                Rated on:{" "}
                {student.last_feedback_day
                  ? new Date(student.last_feedback_day).toLocaleDateString()
                  : "Unknown"}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No ratings found for this student.
          </Typography>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions>
        <Button
          onClick={onClose}
          color="primary"
          variant="contained"
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentRatingsPopup;
