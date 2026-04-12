import { Box, Typography, Card, CardContent } from '@mui/material';

const StatCard = ({ title, value, subtitle, color }) => (
  <Card
    sx={{
      display: 'flex',
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}
  >
    <CardContent sx={{ textAlign: 'center', py: 3 }}>
      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color, mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

export default StatCard;
