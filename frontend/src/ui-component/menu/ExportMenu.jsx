import React, { useState } from 'react';
import { Button, IconButton, Menu, MenuItem, Typography, useTheme } from '@mui/material';
import { IconCsv, IconDots, IconDotsVertical, IconFileSpreadsheet, IconPdf } from '@tabler/icons-react';
import PropTypes from 'prop-types';
import DrogaButton from 'ui-component/buttons/DrogaButton';

export const ExportMenu = ({ orientation, actionButton, onOpen, onClose, onExcelDownload, onCSVDownload, onPDFDownload, sx }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    onOpen && onOpen();
  };

  const handleClose = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    onClose && onClose();
  };

  return (
    <React.Fragment>
      {actionButton ? (
        <Button
          variant="outlined"
          onClick={handleMenuClick}
          sx={{ mr: 4, borderRadius: 2, px: 2 }}
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          Export
        </Button>
      ) : (
        <IconButton
          onClick={handleMenuClick}
          size="small"
          sx={{ ml: 2, ...sx }}
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          {orientation === 'horizontal' ? <IconDots stroke="1.4" size="1.4rem" /> : <IconDotsVertical stroke="1.4" size="1.4rem" />}
        </IconButton>
      )}

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {onExcelDownload && (
          <MenuItem
            onClick={onExcelDownload}
            sx={{
              margin: 0.5,
              borderRadius: theme.shape.borderRadius,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <IconFileSpreadsheet size={18} />
            <Typography variant="body2" color={theme.palette.text.primary} sx={{ marginLeft: 1 }}>
              Excel
            </Typography>
          </MenuItem>
        )}

        {onCSVDownload && (
          <MenuItem
            onClick={onCSVDownload}
            sx={{
              margin: 0.5,
              borderRadius: theme.shape.borderRadius,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <IconCsv size={18} />
            <Typography variant="body2" color={theme.palette.text.primary} sx={{ marginLeft: 1 }}>
              CSV
            </Typography>
          </MenuItem>
        )}

        {onPDFDownload && (
          <MenuItem
            onClick={onPDFDownload}
            sx={{
              margin: 0.5,
              borderRadius: theme.shape.borderRadius,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <IconPdf size={18} color="red" />
            <Typography variant="body2" color={theme.palette.text.primary} sx={{ marginLeft: 1 }}>
              PDF
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </React.Fragment>
  );
};

ExportMenu.propTypes = {
  children: PropTypes.node,
  actionButton: PropTypes.bool,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  onExcelDownload: PropTypes.func,
  onCSVDownload: PropTypes.func,
  onPDFDownload: PropTypes.func,
  orientation: PropTypes.string
};
