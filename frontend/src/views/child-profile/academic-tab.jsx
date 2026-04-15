import { Box, Typography } from '@mui/material';
import { AcademicSummary } from './components/academic-summary';
import { CurrentSemesterInfo } from './components/current-semester-info';
import { SubjectCards } from './components/subject-cards';
import { Container } from '@mui/system';

export default function AcademicDashboard({ data, studentId, userRole = 'parent' }) {
  const isTeacher = userRole === 'teacher';

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {isTeacher && (
          <Typography variant="h5" fontWeight="600" sx={{ mb: 1 }}>
            Teacher Academic View
          </Typography>
        )}

        <AcademicSummary data={data} userRole={userRole} />

        <CurrentSemesterInfo data={data} userRole={userRole} />

        <SubjectCards data={data} studentId={studentId} userRole={userRole} />
      </Box>
    </Box>
  );
}
