import React from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const ChartTable = ({ view, data }) => {
  return (
    <TableContainer>
      <Table
        sx={{
          minWidth: 840,
          borderCollapse: 'collapse'
        }}
        aria-label="Organization unit table"
      >
        <TableHead>
          <TableRow>
            {['Rank', view === 'Employee' ? 'Employee Name' : 'Unit Name', 'Score'].map((header) => (
              <TableCell
                key={header}
                sx={{
                  color: 'grey.500',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  borderBottom: `2px solid #ddd`,
                  padding: '12px 16px',
                  '&:not(:last-of-type)': {
                    borderRight: `1px solid #ddd`
                  }
                }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={item.id}
              sx={{
                backgroundColor: index === 0 ? '#d0f0c0' : 'transparent', 
                borderRadius: 2,
                '&:nth-of-type(odd)': {
                  backgroundColor: index !== 0 ? '#dee8f3' : '#d0f0c0' 
                },
                '&:hover': {
                  backgroundColor: '#f1f1f1'
                }
              }}
            >
              <TableCell
                sx={{
                  border: 0,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {index + 1}
                {index === 0 && <ArrowUpwardIcon sx={{ color: 'green', marginLeft: '8px' }} />}
                {index === data.length - 1 && <ArrowDownwardIcon sx={{ color: 'red', marginLeft: '8px' }} />}
              </TableCell>

              <TableCell
                sx={{
                  border: 0,
                  padding: '12px 16px'
                }}
              >
                {item.name}
              </TableCell>

              <TableCell
                sx={{
                  border: 0,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle3" sx={{ flexGrow: 1 }}>
                    {item.score}
                  </Typography>
                </div>
                {index === 0 && <ArrowUpwardIcon sx={{ color: 'green', marginLeft: '2px' }} />}
                {index === data.length - 1 && <ArrowDownwardIcon sx={{ color: 'red', marginLeft: '2px' }} />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ChartTable;
