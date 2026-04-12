import { useState, useCallback } from 'react';

import Popover from '@mui/material/Popover';
import MenuList from '@mui/material/MenuList';
import ButtonBase from '@mui/material/ButtonBase';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { Typography, useTheme } from '@mui/material';
import {
  IconBuilding,
  IconCircle,
  IconCircleCheckFilled,
  IconDirection,
} from '@tabler/icons-react';
import { handleSettingActingUnit } from 'utils/multiple-unit-manager';
import { useDispatch } from 'react-redux';

// ----------------------------------------------------------------------

export function ActiveUnitSelector({ data = [], active, sx, ...other }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [activeUnit, setActiveUnit] = useState(active);

  const [openPopover, setOpenPopover] = useState(null);
  const handleOpenPopover = useCallback((event) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleChangingActiveUnit = useCallback(
    async (newValue) => {
      if (newValue.id !== activeUnit.id) {
        await handleSettingActingUnit(dispatch, newValue);
      }
      setActiveUnit(newValue);
      handleClosePopover();
    },
    [handleClosePopover],
  );

  return (
    <>
      <ButtonBase
        disableRipple
        onClick={handleOpenPopover}
        sx={{
          pl: 2,
          py: 2.2,
          gap: 1.5,
          pr: 1.5,
          width: 1,
          borderRadius: 2.5,
          textAlign: 'left',
          justifyContent: 'flex-start',
          backgroundColor: theme.palette.grey[100],
          ...sx,
        }}
        {...other}
      >
        <IconBuilding
          size="1.2rem"
          style={{ color: theme.palette.primary[800] }}
        />

        <Typography
          variant="subtitle1"
          color="text.primary"
          gap={1}
          flexGrow={1}
          display="flex"
          alignItems="center"
          sx={{ fontWeight: 'fontWeightSemiBold' }}
        >
          {activeUnit?.name}
        </Typography>

        <IconDirection size="1.6rem" stroke={1.4} style={{ color: '#aaa' }} />
      </ButtonBase>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 260,
            display: 'flex',
            flexDirection: 'column',

            [`& .${menuItemClasses.root}`]: {
              p: 1.5,
              gap: 1.5,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: {
                bgcolor: 'transparent',
                fontWeight: 'fontWeightSemiBold',
              },
            },
          }}
        >
          {data.map((option) => (
            <MenuItem
              key={option.id}
              selected={option.id === activeUnit?.id}
              onClick={() => handleChangingActiveUnit(option)}
              sx={{
                transition: 'all 0.2s ease-in',
                ':hover': {
                  bgcolor: theme.palette.grey[50],
                },
              }}
            >
              <Typography
                variant="subtitle1"
                color="text.primary"
                sx={{ flexGrow: 1 }}
              >
                {option.name}
              </Typography>

              {option.id === activeUnit.id ? (
                <IconCircleCheckFilled
                  size="1.3rem"
                  stroke={1.4}
                  style={{ color: theme.palette.success.dark }}
                />
              ) : (
                <IconCircle
                  size="1.2rem"
                  stroke={2.2}
                  style={{ color: '#aaa' }}
                />
              )}
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  );
}
