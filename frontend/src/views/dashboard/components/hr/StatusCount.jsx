import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import Iconify from '../../../../ui-component/iconify/iconify';

export default function StatusCount({ title, subtitle, total, sx, ...other }) {
  const theme = useTheme();

  const renderTrending = (
    <Box
      sx={{
        top: 16,
        gap: 0.5,
        right: 16,
        display: 'flex',
        position: 'absolute',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          typography: 'h6',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Iconify
          icon="line-md:account"
          style={{ marginRight: 8, fontSize: 20, color: '#FF5722' }}
        />
      </Box>
    </Box>
  );

  return (
    <Card
      sx={{
        border: `solid 1px ${theme.palette.divider}`,
        p: 0.5,
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        backgroundColor: 'common.white',
        ...sx,
      }}
      {...other}
    >
      {renderTrending}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 183 }}>
          <Box sx={{ typography: 'h6', fontWeight: 'bold' }}>{total}</Box>
          <Box sx={{ mb: 0, typography: 'subtitle2' }}>{title}</Box>
          <Box sx={{ typography: 'caption', color: '#7B7B7B' }}>{subtitle}</Box>
        </Box>
      </Box>
    </Card>
  );
}

StatusCount.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  total: PropTypes.number,
  sx: PropTypes.object,
};
