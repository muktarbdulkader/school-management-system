import React, { useState } from 'react';
import { Box, Grid, IconButton, Typography, useTheme } from '@mui/material';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { format } from 'date-fns';
import { DotMenu } from 'ui-component/menu/DotMenu';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PropTypes from 'prop-types';

const BudgetYear = ({ year, startDate, endDate, expand, onExpand, onEdit, onDelete, children }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const FormatDate = (dateString) => {
    const date = new Date(dateString);
    const formattedDate = format(date, 'MM/dd/yyyy');
    return formattedDate;
  };

  return (
    <React.Fragment>
      <DrogaCard
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginY: 0.8,
          backgroundColor: expand && theme.palette.primary.main
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Box>
          <Typography variant="h4" sx={{ color: expand ? 'white' : theme.palette.text.primary, mb: 1 }}>
            {year}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {startDate && (
              <Typography variant="body2" sx={{ marginRight: 1, color: expand ? 'white' : theme.palette.text.primary }}>
                {FormatDate(startDate)}
              </Typography>
            )}
            {endDate && (
              <>
                <span style={{ color: expand ? 'white' : theme.palette.text.primary }}>-</span>
                <Typography variant="body2" sx={{ marginLeft: 1, color: expand ? 'white' : theme.palette.text.primary }}>
                  {FormatDate(endDate)}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <Box>
          {isHovered && <DotMenu onEdit={onEdit} onDelete={onDelete} sx={{ color: expand ? 'white' : theme.palette.text.primary }} />}
          <IconButton onClick={onExpand}>
            {expand ? (
              <IconChevronDown size="1.4rem" stroke="1.4" style={{ color: expand ? 'white' : theme.palette.text.primary }} />
            ) : (
              <IconChevronRight size="1.4rem" stroke="1.4" style={{ color: expand ? 'white' : theme.palette.text.primary }} />
            )}
          </IconButton>
        </Box>
      </DrogaCard>
      <Grid container>
        <Grid item xs={12}>
          {children}
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

BudgetYear.propTypes = {
  year: PropTypes.string,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  expand: PropTypes.bool,
  onExpand: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  children: PropTypes.node
};

export default BudgetYear;
