import React from "react";
import {
  Box,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  Button,
  Rating,
} from "@mui/material";
import { ChevronRight as ChevronRightIcon } from "@mui/icons-material";

// Utility function to truncate long comments
const truncateText = (text, maxLength = 60) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const PastRatingsTable = ({ recentFeedback, handleViewDetails }) => {
  // Flatten all ratings into individual rows
  const rows = recentFeedback?.feedback_list?.flatMap((student) =>
    student.ratings?.length > 0
      ? student.ratings.map((rating, index) => ({
          student,
          rating,
          key: `${student.student_id}-${index}`,
        }))
      : []
  );

  return (
    <CardContent sx={{ p: 0, mb: 4, width: "100%" }}>
      <TableContainer
        sx={{ backgroundColor: "white", borderRadius: 2, p: 2, pt: 4 }}
      >
        <Table aria-label="past ratings table">
          <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Comment</TableCell>
              {/* <TableCell>Status</TableCell> */}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows?.length > 0 ? (
              rows.map(({ student, rating, key }) => (
                <TableRow key={key} hover>
                  {/* Student Name */}
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        src={"/placeholder.svg?height=40&width=40"}
                        sx={{ width: 40, height: 40, mr: 2 }}
                      />
                      <Typography variant="body2" fontWeight="600">
                        {student.student_name}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Rating */}
                  <TableCell>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="flex-start"
                      gap={0.25}
                    >
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Rating
                          value={1} // can replace with rating.score if available
                          max={1}
                          readOnly
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {rating.rating || 0}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {rating.rated_on || "-"}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Comment */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ maxWidth: 200 }}
                      noWrap
                    >
                      {truncateText(rating.description)}
                    </Typography>
                  </TableCell>

                  {/* Status */}
                  {/* <TableCell>
                    <Typography variant="body2" color="success.main">
                      Visible to Admin
                    </Typography>
                  </TableCell> */}

                  {/* Actions */}
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      endIcon={<ChevronRightIcon />}
                      onClick={() =>
                        handleViewDetails({ ...student, rating })
                      }
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No past ratings found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  );
};

export default PastRatingsTable;
