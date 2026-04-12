import React, { useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { IconCircleCheckFilled } from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { SET_SELECTED_FISCAL_YEAR } from 'store/actions';
import GetFiscalYear from 'utils/components/GetFiscalYear';

const FiscalYearSelector = () => {
  const theme = useTheme();
  const SelectFiscalYear = useSelector((state) => state.customization.selectedFiscalYear);
  const fiscalYears = useSelector((state) => state.customization.fiscalYears);

  const [selectedYearId, setSelectedYearId] = useState(SelectFiscalYear?.id || null);
  const dispatch = useDispatch();

  const handleYearSelection = (year) => {
    if (SelectFiscalYear?.id === year.id) {
      setSelectedYearId(null);
    } else {
      dispatch({ type: SET_SELECTED_FISCAL_YEAR, selectedFiscalYear: year });
      setSelectedYearId(year.id);
    }
  };

  return (
    <React.Fragment>
      {fiscalYears ? (
        fiscalYears?.map((year, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingY: 2.2,
              paddingX: 2,
              border: 0.6,
              borderRadius: 2,
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.grey[50],
              cursor: 'pointer',
              marginY: 1.6
            }}
            onClick={() => handleYearSelection(year)}
          >
            <Typography variant="h4">{year.year}</Typography>

            {selectedYearId === year.id && <IconCircleCheckFilled size={24} style={{ color: theme.palette.primary.main }} />}
          </Box>
        ))
      ) : (
        <GetFiscalYear />
      )}

      <ToastContainer />
    </React.Fragment>
  );
};

export default FiscalYearSelector;
