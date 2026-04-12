import fs from 'fs';

const filePath = 'AttendanceMark.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const importReplacement = `import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Avatar,
  Radio,
  LinearProgress,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Pagination,
  useMediaQuery,
  useTheme,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';`;

content = content.replace(/import \{ useState, useEffect \} from 'react';[\s\S]*?from '@mui\/material';/, importReplacement);


const stateReplacement = `  const location = useLocation();
  const initialData = location.state || readRedirectPayload();
  const [activeClassId, setActiveClassId] = useState(initialData?.classId || '');
  const [activeSectionId, setActiveSectionId] = useState(initialData?.sectionId || '');
  const [activeSubjectId, setActiveSubjectId] = useState(initialData?.subjectId || '');
  const [activeClassName, setActiveClassName] = useState(initialData?.className || '');
  const [activeSectionName, setActiveSectionName] = useState(initialData?.sectionName || '');
  const [myClasses, setMyClasses] = useState([]);
  
  const {
    students = [],
  } = initialData || {};
  const [studentsState, setStudents] = useState(students);`;

content = content.replace(/  const location = useLocation\(\);[\s\S]*?const \[studentsState, setStudents\] = useState\(students\);/, stateReplacement);


const useEffectReplacement = `  useEffect(() => {
    const fetchTeacherClasses = async () => {
      try {
        const token = await GetToken();
        const header = { Authorization: \`Bearer \${token}\`, accept: 'application/json' };
        
        const teacherAssignmentsRes = await fetch(\`\${Backend.auth}\${Backend.teachersOverviewDashboard}\`, { headers: header });
        const data = await teacherAssignmentsRes.json();
        
        if (data.success && data.data?.subjects?.length > 0) {
          setMyClasses(data.data.subjects);
          
          if (!activeClassId && !activeSubjectId) {
            const firstClass = data.data.subjects[0];
            setActiveClassId(firstClass.class_id);
            setActiveSectionId(firstClass.section_id || 'null');
            setActiveSubjectId(firstClass.id);
            setActiveClassName(firstClass.class_name);
            setActiveSectionName(firstClass.section_name || 'All');
          }
        }
      } catch (err) {
        console.error('Failed to fetch teacher classes:', err);
      }
    };
    
    fetchTeacherClasses();
  }, [activeClassId, activeSubjectId]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!activeClassId || !activeSubjectId) return;
      
      try {
        const token = await GetToken();
        const header = {
          Authorization: \`Bearer \${token}\`,
          accept: 'application/json',
        };
        const today = new Date().toISOString().split('T')[0];
        
        const actualSectionId = activeSectionId === 'null' || !activeSectionId ? 'null' : activeSectionId;
        const attendanceApi = \`\${Backend.api}\${Backend.teachersAttendanceDashboard}/\${activeClassId}/\${actualSectionId}/\${activeSubjectId}/?date=\${today}\`;
        
        console.log('Fetching attendance from:', attendanceApi);
        
        const res = await fetch(attendanceApi, {
          method: 'GET',
          headers: header,
        });
        
        if (!res.ok) {
          console.error('Attendance API failed with status:', res.status);
          toast.error(\`Failed to fetch attendance. Status: \${res.status}\`);
          return;
        }
        
        const result = await res.json();
        console.log('Fetched attendance API response:', result);
        
        if (result.success && Array.isArray(result?.data?.students)) {
          // Map API records to the shape we use
          const apiStudents = result.data.students.map((rec) => {
            // Normalize status to lowercase
            let status = (rec.status ?? '').toString().toLowerCase();
            if (status === 'excused') status = 'permission';
            if (status === 'no permission' || status === 'no_permission') status = 'noPermission';
            
            return {
              id: rec.id ?? rec.student_id ?? rec.user_id,
              name: rec.name ?? rec.full_name ?? '',
              studentId: rec.student_id ?? rec.studentId ?? '',
              avatar: rec.avatar ?? null,
              attendance_status: status || null,
              attendance_comment: rec.comment ?? rec.attendance_comment ?? '',
            };
          });

          setStudents(apiStudents);
        } else {
          toast.info('No students found for this class/section/subject');
          setStudents([]);
        }
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
        toast.error('Error fetching attendance: ' + (err.message || err));
      }
    };

    if (activeClassId && activeSubjectId) {
      fetchAttendance();
    } else {
      console.warn('Missing required parameters');
    }
  }, [activeClassId, activeSectionId, activeSubjectId]);`;

content = content.replace(/  useEffect\(\(\) => \{[\s\S]*?\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n  \}, \[classId, sectionId, subjectId\]\);/, useEffectReplacement);

// Replace variables inside handleSubmit
content = content.replace(/const individualApi = \`\$\{Backend\.api\}\$\{Backend\.teachersMarkAttendance\}\/\$\{classId\}\/\$\{sectionId\}\/\$\{subjectId\}\/\`;/, 
  "const actualSectionId = activeSectionId === 'null' || !activeSectionId ? 'null' : activeSectionId;\n      const individualApi = `${Backend.api}${Backend.teachersMarkAttendance}/${activeClassId}/${actualSectionId}/${activeSubjectId}/`;");

// Add Class Selector UI to header
const headerReplacement = `      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            sx={{
              fontWeight: 'bold',
              color: 'text.primary',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' },
            }}
          >
            Mark Attendance {activeClassName ? \` - \${activeClassName}\` : ''} {activeSectionName && activeSectionName !== 'All' ? \` - \${activeSectionName}\` : ''}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: 2,
              mt: 0.5
            }}
          >
             {new Date().toISOString().split('T')[0]}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 1, minWidth: 300 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Select Class to Mark</InputLabel>
              <Select
                value={activeSubjectId ? \`\${activeClassId}|\${activeSectionId}|\${activeSubjectId}\` : ''}
                label="Select Class to Mark"
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const [cId, sId, subId] = val.split('|');
                  const targetSubject = myClasses.find(c => c.id === subId && c.class_id === cId);
                  if (targetSubject) {
                    setActiveClassId(cId);
                    setActiveSectionId(sId);
                    setActiveSubjectId(subId);
                    setActiveClassName(targetSubject.class_name);
                    setActiveSectionName(targetSubject.section_name || 'All');
                  }
                }}
              >
                {myClasses.map((subj) => (
                  <MenuItem key={\`\${subj.class_id}|\${subj.section_id || 'null'}|\${subj.id}\`} value={\`\${subj.class_id}|\${subj.section_id || 'null'}|\${subj.id}\`}>
                    {subj.class_name} {subj.section_name ? \`- \${subj.section_name}\` : ''} ({subj.name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>`;

content = content.replace(/      \{\/\* Header \*\/\}[\s\S]*?<\/Box>/, headerReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('AttendanceMark.jsx mapped correctly.');
