import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import PlanTable from './PlanTable';

const DistributedTargetTable = ({ units }) => {
  const theme = useTheme();
  const [selectedRow, setSelectedRow] = useState(null);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);

  const handleRowClick = (index, unitId) => {
    if (selectedRow === index) {
      setSelectedRow(null);
    } else {
      setSelectedRow(index);
      handleFetchingUnitPlan(unitId);
    }
  };

  const handleFetchingUnitPlan = (unitId) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const Api = Backend.api + Backend.getUnitTarget + unitId;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    fetch(Api, {
      method: 'GET',
      headers: header
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setData(response.data);
          setLoading(false);
          setError(false);

          console.log(response.data);
        } else {
          setLoading(false);
          setError(false);
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
        setError(true);
        setLoading(false);
      });
  };

  return (
    <TableContainer component={Paper} sx={{ minHeight: '66dvh', border: 0.4, borderColor: theme.palette.grey[300], borderRadius: 2 }}>
      <Table sx={{ minWidth: 650 }} aria-label="Organization unit table">
        <TableHead>
          <TableRow>
            <TableCell>Unit name</TableCell>
            <TableCell>Unit Manager</TableCell>
            <TableCell>KPI Weight</TableCell>
            <TableCell>Target</TableCell>
            <TableCell>Actual</TableCell>
            <TableCell>Achievement</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {units?.map((unit, index) => (
            <>
              <TableRow
                key={index}
                sx={{
                  backgroundColor: selectedRow == index ? theme.palette.grey[100] : theme.palette.background.default,
                  ':hover': {
                    backgroundColor: theme.palette.grey[100],
                    color: theme.palette.background.default,
                    cursor: 'pointer',
                    borderRadius: 2
                  }
                }}
              >
                <TableCell sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
                  <IconButton aria-label="expand row" size="small" onClick={() => handleRowClick(index, unit.id)}>
                    {selectedRow === index ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </IconButton>

                  <Typography variant="subtitle1">{unit?.name}</Typography>
                </TableCell>
                <TableCell sx={{ border: 0 }}>
                  {unit?.manager?.user?.name} <Typography variant="body2">{unit?.manager?.position}</Typography>
                </TableCell>
                <TableCell sx={{ border: 0 }}>{unit?.unit_type?.name}</TableCell>
                <TableCell sx={{ border: 0 }}>
                  <Button variant="outlined" onClick={() => handleRowClick(index, unit.id)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>

              {selectedRow == index && (
                <TableRow sx={{ border: 0 }}>
                  <TableCell colSpan={7}>
                    <Collapse in={selectedRow !== null} timeout="auto" unmountOnExit>
                      {loading ? (
                        <TableRow sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                          <TableCell colSpan={7} sx={{ border: 0 }}>
                            <CircularProgress size={20} />
                          </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow sx={{ padding: 4 }}>
                          <TableCell colSpan={7} sx={{ border: 0 }}>
                            <Typography variant="body2">There is error fetching the unit target</Typography>
                          </TableCell>
                        </TableRow>
                      ) : data.length === 0 ? (
                        <TableRow sx={{ padding: 4 }}>
                          <TableCell colSpan={7} sx={{ border: 0 }}>
                            <Typography variant="body2">There is no target found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow sx={{}}>
                          <TableCell colSpan={7} sx={{ width: '100%', border: 0 }}>
                            <PlanTable plans={data} unitName={unit?.name} unitType={unit?.unit_type?.name} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DistributedTargetTable;
