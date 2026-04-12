import { Box, Typography } from '@mui/material';
import { AcademicSummary } from './components/academic-summary';
import { CurrentSemesterInfo } from './components/current-semester-info';
import { SubjectCards } from './components/subject-cards';
import { Container } from '@mui/system';

export default function AcademicDashboard({ data, studentId }) {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <AcademicSummary data={data} />

        <CurrentSemesterInfo data={data} />

        <SubjectCards data={data} studentId={studentId} />
      </Box>
    </Box>
  );
}
