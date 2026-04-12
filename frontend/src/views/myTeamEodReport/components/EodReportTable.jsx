import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/system';
import { DotMenu } from 'ui-component/menu/DotMenu';
import StarRating from 'ui-component/Rating/StarRating';

const EodReportTable = ({ reports, onViewDetail }) => {
  const theme = useTheme();

  const renderSatisfaction = (value) => {
    const numericValue = Number(value || 0);

    return (
      <Box display="flex" alignItems="center">
        <StarRating value={numericValue} size="small" />
      </Box>
    );
  };

  return (
    <TableContainer
      sx={{
        minHeight: '66dvh',
        border: 0.4,
        borderColor: theme.palette.divider,
        borderRadius: 2,
      }}
    >
      <Table sx={{ minWidth: 650 }} aria-label="EOD reports table">
        <TableHead>
          <TableRow>
            <TableCell>Completed</TableCell>
            <TableCell>Not Completed</TableCell>
            <TableCell>Challenges</TableCell>
            <TableCell>Next Actions</TableCell>
            <TableCell>Satisfaction</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell sx={{ maxWidth: 200 }}>
                <Tooltip title={report.completed}>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {report.completed}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ maxWidth: 200 }}>
                <Tooltip title={report.not_completed}>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {report.not_completed}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ maxWidth: 200 }}>
                <Tooltip title={report.challenge_faced}>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {report.challenge_faced}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ maxWidth: 200 }}>
                <Tooltip title={report.next_action}>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {report.next_action}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell>
                {renderSatisfaction(Number(report.satisfaction || 0))}
              </TableCell>
              <TableCell>
                <DotMenu onView={() => onViewDetail(report)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EodReportTable;
