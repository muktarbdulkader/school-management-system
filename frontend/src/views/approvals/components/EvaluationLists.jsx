import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, Collapse, useTheme } from '@mui/material';

export const EvaluationLists = ({ evaluations }) => {
  const theme = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleExpanding = (index) => {
    if (index === selectedIndex) {
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
    }
  };

  return (
    <TableContainer component={Paper} style={{ marginTop: '16px', minHeight: '60dvh' }}>
      <Table>
        <TableHead sx={{ backgroundColor: theme.palette.grey[100] }}>
          <TableRow>
            <TableCell>
              <strong>Evaluated KPI</strong>
            </TableCell>

            <TableCell>
              <strong>Weight (%)</strong>
            </TableCell>
            <TableCell>
              <strong>Target</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {evaluations.map((kpi, index) => (
            <>
              <TableRow
                key={index}
                onClick={() => handleExpanding(index)}
                sx={{
                  backgroundColor: selectedIndex === index && theme.palette.grey[100],
                  ':hover': {
                    backgroundColor: theme.palette.grey[100]
                  },
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out'
                }}
              >
                <TableCell>
                  <Typography
                    variant="subtitle1"
                    color="text.primary"
                    sx={{
                      textTransform: 'capitalize'
                    }}
                  >
                    {kpi.kpi}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {kpi.perspective_type}
                  </Typography>
                </TableCell>

                <TableCell>{kpi?.weight}%</TableCell>
                <TableCell>{kpi?.total_target}</TableCell>
              </TableRow>

              <TableRow sx={{ backgroundColor: selectedIndex === index && theme.palette.grey[50] }}>
                <TableCell colSpan={4} sx={{ m: 0, p: 0, borderBottom: 0 }}>
                  <Collapse in={selectedIndex === index}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <strong>Period</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Target</strong>
                          </TableCell>

                          <TableCell>
                            <strong>Monthly Sum</strong>
                          </TableCell>

                          <TableCell>
                            <strong>Actual Value</strong>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {kpi.target.map(
                          (subEval, index) =>
                            subEval.is_evaluated && (
                              <TableRow key={index}>
                                <TableCell sx={{ textTransform: 'capitalize' }}>{subEval.name}</TableCell>
                                <TableCell>{subEval.target}</TableCell>
                                <TableCell>{subEval.monthly_actual}</TableCell>
                                <TableCell>{subEval.actual_value}</TableCell>
                              </TableRow>
                            )
                        )}
                      </TableBody>
                    </Table>
                  </Collapse>
                </TableCell>
              </TableRow>
            </>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
