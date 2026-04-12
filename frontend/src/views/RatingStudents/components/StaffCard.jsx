import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Avatar,
  Rating,
  Chip,
  useTheme,
  TablePagination,
} from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { useState } from 'react';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import { DotMenu } from 'ui-component/menu/DotMenu';

const StaffCard = ({ staff, onRateClick, loading, error }) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const getRoleColor = (role) => {
    if (!role) return 'default';

    switch (role.toLowerCase()) {
      case 'teacher':
        return 'primary';
      case 'principal':
        return 'secondary';
      case 'staff':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          border: 0.4,
          borderColor: theme.palette.divider,
          borderRadius: 2,
          mb: 2,
          bgcolor: 'white',
          minHeight: 200,
        }}
      >
        <ActivityIndicator size={20} />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <ErrorPrompt
        title="Server Error"
        message="Unable to retrieve staff information."
        sx={{
          border: 0.4,
          borderColor: theme.palette.divider,
          borderRadius: 2,
          mb: 2,
        }}
      />
    );
  }

  // Show empty state
  if (!staff) {
    return (
      <Fallbacks
        severity="evaluation"
        title="Staff Not Found"
        description="Staff information will be displayed here."
        sx={{
          border: 0.4,
          borderColor: theme.palette.divider,
          borderRadius: 2,
          mb: 2,
          paddingTop: 6,
        }}
      />
    );
  }

  // Safely extract properties with fallbacks
  const staffName = staff.full_name || staff.name || 'Unknown Staff';
  const staffRole = staff.role || 'Unknown Role';
  const staffSubject = staff.subject || '-';
  const staffAvatar = staff.avatar || '/placeholder.svg?height=40&width=40';
  const hasRating = staff.hasRating || false;
  const ratingValue = staff.rating || 0;
  const ratingDate = staff.date || '-';

  return (
    <TableContainer
      sx={{
        border: 0.4,
        borderColor: theme.palette.divider,
        borderRadius: 2,
        mb: 2,
        bgcolor: 'white',
      }}
    >
      <Table aria-label="staff table">
        <TableHead>
          <TableRow>
            <TableCell>Staff Member</TableCell>
            {/* <TableCell>Role</TableCell>
            <TableCell>Subject</TableCell> */}
            <TableCell>Rating</TableCell>
            <TableCell>Last Rated</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow
            sx={{
              ':hover': {
                backgroundColor: theme.palette.grey[50],
              },
            }}
          >
            {/* Staff Member */}
            <TableCell>
              <Box display="flex" alignItems="center">
                <Avatar
                  src={staffAvatar}
                  sx={{
                    width: 40,
                    height: 40,
                    mr: 2,
                    border: '2px solid',
                    borderColor: 'primary.light',
                  }}
                />
                <Box>
                  <Typography variant="body2" fontWeight="600">
                    {staffName}
                  </Typography>
                </Box>
              </Box>
            </TableCell>

            {/* Role */}
            {/* <TableCell>
              <Chip
                label={staffRole}
                color={getRoleColor(staffRole)}
                size="small"
                sx={{ fontWeight: 500 }}
              />
            </TableCell> */}

            {/* Subject */}
            {/* <TableCell>
              <Typography variant="body2" color="text.secondary">
                {staffSubject}
              </Typography>
            </TableCell> */}

            {/* Rating */}
            <TableCell>
              {hasRating ? (
                <Box display="flex" alignItems="center">
                  <Rating value={ratingValue} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary" ml={1}>
                    {ratingValue}.0
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not rated yet
                </Typography>
              )}
            </TableCell>

            {/* Last Rated */}
            <TableCell>
              <Typography variant="body2" color="text.secondary">
                {hasRating ? ratingDate : '-'}
              </Typography>
            </TableCell>

            {/* Actions */}
            <TableCell>
              {hasRating ? (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
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
              ) : (
                <Box>
                  {/* <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                    onClick={() => onRateClick(staff)}
                  >
                    Rate & Comment
                  </Button> */}

                  <DotMenu
                    onRate={() => onRateClick(staff)}
                    onView={() => console.log('View')}
                  />
                </Box>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={1}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </TableContainer>
  );
};

export default StaffCard;
