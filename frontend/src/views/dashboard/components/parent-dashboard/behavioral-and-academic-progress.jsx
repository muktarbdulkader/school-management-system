// import { Box, Typography, Card, CardContent, Grid } from '@mui/material';

// function CircularProgress({ percentage, color, size = 120, onClick }) {
//   const radius = (size - 20) / 2;
//   const circumference = 2 * Math.PI * radius;
//   const strokeDasharray = circumference;
//   const strokeDashoffset = circumference - (percentage / 100) * circumference;

//   return (
//     <Box
//       sx={{
//         position: 'relative',
//         display: 'inline-flex',
//         cursor: onClick ? 'pointer' : 'default',
//         '&:hover': {
//           transform: onClick ? 'scale(1.05)' : 'none',
//           transition: 'transform 0.2s ease',
//         },
//       }}
//       onClick={onClick}
//     >
//       <svg width={size} height={size}>
//         <circle
//           cx={size / 2}
//           cy={size / 2}
//           r={radius}
//           stroke="#f0f0f0"
//           strokeWidth="10"
//           fill="transparent"
//         />
//         <circle
//           cx={size / 2}
//           cy={size / 2}
//           r={radius}
//           stroke={color}
//           strokeWidth="10"
//           fill="transparent"
//           strokeDasharray={strokeDasharray}
//           strokeDashoffset={strokeDashoffset}
//           strokeLinecap="round"
//           transform={`rotate(-90 ${size / 2} ${size / 2})`}
//           style={{
//             transition: 'stroke-dashoffset 0.5s ease-in-out',
//           }}
//         />
//       </svg>
//       <Box
//         sx={{
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           bottom: 0,
//           right: 0,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//         }}
//       >
//         <Typography variant="h4" fontWeight="bold">
//           {percentage}%
//         </Typography>
//       </Box>
//     </Box>
//   );
// }

// export default function BehavioralAndAcademicProgress({
//   metrics,
//   onMetricClick,
// }) {
//   return (
//     <Box sx={{ bgcolor: '#fff', p: 3, borderRadius: 2 }}>
//       <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
//         Behavioral and academic progress
//       </Typography>

//       <Grid container spacing={3}>
//         {metrics.map((metric, index) => (
//           <Grid item xs={12} sm={4} key={index}>
//             <Card sx={{ cursor: onMetricClick ? 'pointer' : 'default' }}>
//               <CardContent sx={{ textAlign: 'center', py: 3 }}>
//                 <CircularProgress
//                   percentage={metric.percentage}
//                   color={metric.color}
//                   onClick={() => onMetricClick?.(metric)}
//                 />
//                 <Typography variant="h6" fontWeight="bold" sx={{ mt: 2 }}>
//                   {metric.label}
//                 </Typography>
//               </CardContent>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>
//     </Box>
//   );
// }

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress as MuiCircularProgress,
} from '@mui/material';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';

function CircularProgress({ percentage, color, size = 120, onClick }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          transform: onClick ? 'scale(1.05)' : 'none',
          transition: 'transform 0.2s ease',
        },
      }}
      onClick={onClick}
    >
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f0f0f0"
          strokeWidth="10"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          {percentage}%
        </Typography>
      </Box>
    </Box>
  );
}

export default function BehavioralAndAcademicProgress({
  metrics = [],
  onMetricClick,
  loading = false,
  error = null,
}) {
  return (
    <Box sx={{ bgcolor: '#fff', p: 3, borderRadius: 2 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Behavioral and academic progress
      </Typography>

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
          }}
        >
          <MuiCircularProgress />
        </Box>
      ) : error ? (
        <ErrorPrompt
          title="Error Loading Progress Data"
          message={
            error.message || 'There was an error loading progress metrics'
          }
          size={100}
        />
      ) : metrics.length === 0 ? (
        <Fallbacks
          severity="info"
          title="No Progress Data Available"
          description="There are no behavioral or academic progress metrics to display"
          sx={{ paddingTop: 6 }}
          size={100}
        />
      ) : (
        <Grid container spacing={3}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Card sx={{ cursor: onMetricClick ? 'pointer' : 'default' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress
                    percentage={metric.percentage}
                    color={metric.color}
                    onClick={() => onMetricClick?.(metric)}
                  />
                  <Typography variant="h6" fontWeight="bold" sx={{ mt: 2 }}>
                    {metric.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
