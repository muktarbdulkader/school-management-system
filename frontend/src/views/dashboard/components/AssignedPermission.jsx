import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  useTheme,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton
} from '@mui/material';
import { IconTargetArrow, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { gridSpacing } from 'store/constant';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const AssignedPermissions = ({ assigneperm }) => {
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [visibility, setVisibility] = useState({});

  const toggleVisibility = (index) => {
    setVisibility((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <Grid item xs={12}>
      <Grid container spacing={gridSpacing}>
        <Grid item xs={12}>
          <Box>
            {loading ? (
              <Box sx={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size={20} />
              </Box>
            ) : error ? (
              <Box sx={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2">There is an error fetching the assigned Permissions</Typography>
              </Box>
            ) : assigneperm.length === 0 ? (
              <Box sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <IconTargetArrow size={80} color={theme.palette.grey[400]} />
                <Typography variant="h4" sx={{ marginTop: 1.6 }}>
                  Role not found
                </Typography>
                <Typography variant="caption">The list of assigned permissions will be listed here</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ minHeight: '22dvh' }}>
                <Table sx={{ minWidth: 450 }} aria-label="unit plan table">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.common.white, fontWeight: 'bold' }}
                      >
                        Roles
                      </TableCell>
                      <TableCell
                        sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.common.white, fontWeight: 'bold' }}
                      >
                        Total Permissions Assigned
                      </TableCell>
                      <TableCell
                        sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.common.white, fontWeight: 'bold' }}
                      >
                        Permissions Name
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assigneperm.map((assign, index) => {
                      const limit = 3;
                      const showAllPermissions = visibility[index];

                      return (
                        <TableRow
                          key={index}
                          sx={{
                            backgroundColor: index % 2 === 0 ? theme.palette.background.default : theme.palette.grey[50],
                            ':hover': {
                              backgroundColor: theme.palette.grey[100],
                              cursor: 'pointer'
                            }
                          }}
                        >
                          <TableCell
                            sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: theme.palette.grey[300] }}
                          >
                            <Typography variant="subtitle1" color={theme.palette.text.primary}>
                              {assign?.name}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ border: '1px solid', borderColor: theme.palette.grey[300] }}>
                            {assign?.permissions_count}
                          </TableCell>
                          <TableCell sx={{ border: '1px solid', borderColor: theme.palette.grey[300] }}>
                            {assign?.permissions && (
                              <>
                                {assign?.permissions.slice(0, showAllPermissions ? assign.permissions.length : limit).map((permission) => (
                                  <Chip
                                    key={permission.uuid}
                                    label={permission.name}
                                    sx={{ margin: 0.4 }}
                                    variant="outlined"
                                    color="primary"
                                  />
                                ))}
                                {assign?.permissions.length > limit && (
                                  <IconButton onClick={() => toggleVisibility(index)} sx={{ marginLeft: 1 }}>
                                    {showAllPermissions ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                                  </IconButton>
                                )}
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AssignedPermissions;
