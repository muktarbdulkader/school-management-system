// material-ui
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// ==============================|| FOOTER - AUTHENTICATION 2 & 3 ||============================== //

const AuthFooter = () => (
  <Stack direction="row" justifyContent="space-between">
    <Typography
      style={{ color: '#fff' }}
      variant="subtitle2"
      component={Link}
      href=""
      target="_blank"
      underline="hover"
    >
      www.SMS.com
    </Typography>
    <Typography
      style={{ color: '#fff' }}
      variant="subtitle2"
      component={Link}
      href=""
      target="_blank"
      underline="hover"
    >
      &copy; SMS
    </Typography>
  </Stack>
);

export default AuthFooter;
