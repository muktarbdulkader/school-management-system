'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';

export default function GradeBookPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [term, setTerm] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');

  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    classAverage: 0,
    highestScore: 0,
    lowestScore: 0,
    missingAssignments: 0,
  });

  // Dialog states
  const [openExamDialog, setOpenExamDialog] = useState(false);
  const [openGradeDialog, setOpenGradeDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);

  // Form states
  const [examForm, setExamForm] = useState({
    name: '',
    exam_type: 'Quiz',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    max_score: 100,
    description: '',
  });

  const [gradeForm, setGradeForm] = useState({
    score: '',
    max_score: 100,
    remarks: '',
  });

  const user = useSelector((state) => state?.user?.user);

  const location = useLocation();
  const stateData = location.state || {};

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle passed state for auto-selection
  useEffect(() => {
    if (stateData.classId) setGrade(stateData.classId);
    if (stateData.sectionId && stateData.sectionId !== 'null') setSection(stateData.sectionId);
    if (stateData.subjectId) setSubject(stateData.subjectId);
    if (stateData.termId) setTerm(stateData.termId);
  }, [stateData]);

  useEffect(() => {
    if (grade) {
      // Clear section when grade changes to avoid stale section ID
      setSection('');
      fetchSections(grade);
    }
  }, [grade]);

  useEffect(() => {
    console.log('Selection changed - term:', term, 'grade:', grade, 'section:', section, 'subject:', subject);
    if (grade && subject && term) {
      console.log('All selections complete, fetching students and grades');
      fetchStudentsAndGrades();
    } else {
      console.log('Selections incomplete, clearing data');
      // Clear data when selections are incomplete
      setStudents([]);
      setExams([]);
      setExamResults([]);
      setStats({
        classAverage: 0,
        highestScore: 0,
        lowestScore: 0,
        missingAssignments: 0,
      });
    }
  }, [grade, section, subject, term]);

  const fetchInitialData = async () => {
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Fetch terms
      const termsRes = await fetch(`${Backend.api}${Backend.terms}`, { headers: header });
      const termsData = await termsRes.json();
      console.log('Terms API response:', termsData);

      if (termsData.success && termsData.data) {
        setTerms(termsData.data || []);
        // Set current term as default
        const currentTerm = (termsData.data || []).find(t => t.is_current);
        if (currentTerm) {
          setTerm(currentTerm.id);
          console.log('Set current term:', currentTerm.id);
        } else if (termsData.data.length > 0) {
          setTerm(termsData.data[0].id);
          console.log('Set first term:', termsData.data[0].id);
        }
      }

      // Fetch teacher's assigned classes/subjects
      console.log('Fetching teacher assignments from:', `${Backend.auth}${Backend.teachersOverviewDashboard}`);
      const teacherAssignmentsRes = await fetch(`${Backend.auth}${Backend.teachersOverviewDashboard}`, { headers: header });

      if (!teacherAssignmentsRes.ok) {
        console.error('Teacher assignments API failed with status:', teacherAssignmentsRes.status);
        const errorText = await teacherAssignmentsRes.text();
        console.error('Error response:', errorText);
        toast.error('Failed to load teacher assignments. Status: ' + teacherAssignmentsRes.status);
        return;
      }

      const teacherAssignmentsData = await teacherAssignmentsRes.json();
      console.log('Teacher assignments full response:', teacherAssignmentsData);

      if (teacherAssignmentsData.success && teacherAssignmentsData.data?.subjects) {
        const teacherSubjects = teacherAssignmentsData.data.subjects;

        // Extract unique classes from teacher assignments
        const uniqueClasses = [...new Map(teacherSubjects
          .filter(item => item.class_id)
          .map(item => [item.class_id, {
            id: item.class_id,
            grade: item.class_name
          }])
        ).values()];

        // Extract unique subjects from teacher assignments
        const uniqueSubjects = [...new Map(teacherSubjects
          .filter(item => item.id)
          .map(item => [item.id, {
            id: item.id,
            name: item.name,
            code: item.code
          }])
        ).values()];

        console.log('Unique classes extracted:', uniqueClasses);
        console.log('Unique subjects extracted:', uniqueSubjects);

        if (uniqueClasses.length === 0) {
          toast.warning('No classes found in teacher assignments. Please ensure you are assigned to classes.');
        }
        if (uniqueSubjects.length === 0) {
          toast.warning('No subjects found in teacher assignments. Please ensure you are assigned to subjects.');
        }

        setClasses(uniqueClasses);
        setSubjects(uniqueSubjects);

        // Set defaults from state or first available
        if (stateData.classId) {
          setGrade(stateData.classId);
        } else if (uniqueClasses.length > 0) {
          setGrade(uniqueClasses[0].id);
        }

        if (stateData.subjectId) {
          setSubject(stateData.subjectId);
        } else if (uniqueSubjects.length > 0) {
          setSubject(uniqueSubjects[0].id);
        }

        if (stateData.sectionId && stateData.sectionId !== 'null') {
          setSection(stateData.sectionId);
        }

        if (stateData.termId) {
          setTerm(stateData.termId);
        }
      } else {
        console.warn('No teacher assignments found or empty data');
        console.log('Success flag:', teacherAssignmentsData.success);
        console.log('Data exists:', !!teacherAssignmentsData.data);
        console.log('Data length:', teacherAssignmentsData.data?.length);
        toast.error('No class assignments found. Please contact administrator to assign you to classes and subjects.');
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load initial data: ' + error.message);
    }
  };

  const fetchSections = async (classId) => {
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Fetch all sections for this class
      const response = await fetch(`${Backend.api}${Backend.sections}?class_id=${classId}`, { headers: header });
      const data = await response.json();
      console.log('All sections:', data);
      console.log('Selected class ID:', classId);

      if (data.success) {
        // Backend already filters by class_id for teachers, use data directly
        const classSections = data.data || [];
        console.log('Sections from API:', classSections);
        setSections(classSections);

        // Auto-select first section if not already set or passed from state
        if (classSections.length > 0 && !section && !stateData.sectionId) {
          setSection(classSections[0].id);
        } else if (classSections.length === 0) {
          setSection('');
        }
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to fetch sections');
    }
  };

  const fetchStudentsAndGrades = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Fetch students in this class/section
      let studentsList = [];
      try {
        const studentsRes = await fetch(`${Backend.api}${Backend.students}`, { headers: header });
        const studentsData = await studentsRes.json();
        studentsList = studentsData.success ? studentsData.data || [] : [];
        console.log('Students from API:', studentsList.length);
      } catch (e) {
        console.error('Failed to fetch students:', e);
      }

      // Filter students by grade and section
      studentsList = studentsList.filter(s => {
        const studentGrade = s.grade_details?.id || s.grade?.id || s.grade;
        const studentSection = s.section_details?.id || s.section?.id || s.section;

        // If no grade match, skip
        if (!studentGrade || String(studentGrade) !== String(grade)) {
          return false;
        }

        // If section is selected, match it; otherwise include all students in the grade
        if (section && studentSection) {
          return String(studentSection) === String(section);
        }

        // Include students with no section assigned when no section is selected
        return true;
      });

      console.log('Filtered students:', studentsList.length);
      setStudents(studentsList);

      // Fetch exams for this class/section/subject
      let examsList = [];
      try {
        const examsRes = await fetch(`${Backend.api}${Backend.exams}`, { headers: header });
        const examsData = await examsRes.json();
        examsList = examsData.success ? examsData.data || [] : [];
        console.log('Exams from API:', examsList.length);

        // Filter exams by class, section, and subject
        examsList = examsList.filter(e => {
          const examClass = e.class_details?.id || e.class_id?.id || e.class_id;
          const examSection = e.section_details?.id || e.section_id?.id || e.section_id;
          const examSubject = e.subject_details?.id || e.subject_id?.id || e.subject_id;
          return String(examClass) === String(grade) &&
            (!section || String(examSection) === String(section)) &&
            String(examSubject) === String(subject);
        });
      } catch (e) {
        console.error('Failed to fetch exams:', e);
      }

      console.log('Filtered exams:', examsList.length);
      setExams(examsList);

      // Fetch exam results
      let resultsList = [];
      try {
        const resultsRes = await fetch(`${Backend.api}${Backend.examResults}`, { headers: header });
        const resultsData = await resultsRes.json();
        resultsList = resultsData.success ? resultsData.data || [] : [];
        console.log('Exam results from API:', resultsList.length);
      } catch (e) {
        console.error('Failed to fetch exam results:', e);
      }
      setExamResults(resultsList);

      // Calculate statistics
      calculateStats(studentsList, resultsList, examsList);
    } catch (error) {
      console.error('Error in fetchStudentsAndGrades:', error);
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (studentsList, resultsList, examsList) => {
    if (resultsList.length === 0) {
      setStats({
        classAverage: 0,
        highestScore: 0,
        lowestScore: 0,
        missingAssignments: 0,
      });
      return;
    }

    const scores = resultsList.map(r => (r.score / r.max_score) * 100);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    // Count missing results
    const totalExpected = studentsList.length * examsList.length;
    const missing = totalExpected - resultsList.length;

    setStats({
      classAverage: average.toFixed(0),
      highestScore: highest.toFixed(0),
      lowestScore: lowest.toFixed(0),
      missingAssignments: missing,
    });
  };

  const getStudentResults = (studentId) => {
    return examResults.filter(r => r.student_id === studentId);
  };

  const getStudentTotal = (studentId) => {
    const results = getStudentResults(studentId);
    if (results.length === 0) return '0%';

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalMax = results.reduce((sum, r) => sum + r.max_score, 0);

    if (totalMax === 0) return '0%';
    return `${((totalScore / totalMax) * 100).toFixed(0)}%`;
  };

  const getExamScore = (studentId, examId) => {
    const result = examResults.find(r => r.student_id === studentId && r.exam_id === examId);
    if (!result) {
      return (
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleOpenGradeDialog(students.find(s => s.id === studentId), examId)}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      );
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2">{result.score}/{result.max_score}</Typography>
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleOpenGradeDialog(students.find(s => s.id === studentId), examId)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  const getScoreColor = (total) => {
    const score = Number.parseInt(total);
    if (score >= 90) return 'success.main';
    if (score >= 80) return 'info.main';
    if (score >= 70) return 'warning.main';
    return 'error.main';
  };

  const getClassName = () => {
    const classObj = classes.find(c => c.id === grade);
    const sectionObj = sections.find(s => s.id === section);
    const subjectObj = subjects.find(s => s.id === subject);
    return `${classObj?.grade || ''} ${sectionObj?.name || ''} ${subjectObj?.name || ''}`;
  };

  const filteredStudents = students.filter(student =>
    student.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Create Exam
  const handleCreateExam = async () => {
    try {
      // Validate required fields
      if (!term || !subject || !grade) {
        toast.error('Please select term, class, and subject first');
        return;
      }

      if (!examForm.start_date || !examForm.end_date) {
        toast.error('Please provide start and end dates');
        return;
      }

      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Get branch_id - try from user or use a default
      let branchId = user?.branch_id;
      if (!branchId) {
        // Fetch user's branch from their profile or use first available branch
        try {
          const branchRes = await fetch(`${Backend.api}${Backend.branches}`, { headers: header });
          const branchData = await branchRes.json();
          if (branchData.success && branchData.data.length > 0) {
            branchId = branchData.data[0].id;
          }
        } catch (e) {
          console.error('Error fetching branches:', e);
        }
      }

      if (!branchId) {
        toast.error('Branch information is required. Please contact administrator.');
        return;
      }

      const payload = {
        name: examForm.name,
        exam_type: examForm.exam_type,
        start_date: examForm.start_date,
        end_date: examForm.end_date,
        start_time: examForm.start_time || null,
        end_time: examForm.end_time || null,
        max_score: examForm.max_score || 100,
        description: examForm.description || '',
        term_id: term,
        subject_id: subject,
        class_id: grade,
        section_id: section || null,
        branch_id: branchId,
        created_by: user?.id || null,
      };

      console.log('Creating exam with payload:', payload);

      const response = await fetch(`${Backend.api}${Backend.exams}`, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Create exam response:', data);

      if (response.ok && data.success) {
        toast.success('Assessment created successfully!');
        setOpenExamDialog(false);
        setExamForm({ name: '', exam_type: 'Quiz', start_date: '', end_date: '', start_time: '', end_time: '', max_score: 100, description: '' });
        fetchStudentsAndGrades();
      } else {
        const errorMsg = data.message || data.error || 'Failed to create assessment';
        console.error('Assessment creation failed:', data);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error('Failed to create assessment: ' + error.message);
    }
  };

  // Handle Enter Grade
  const handleEnterGrade = async () => {
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const payload = {
        student_id: selectedStudent.id,
        subject_id: subject,
        exam_id: selectedExam,
        score: parseFloat(gradeForm.score),
        max_score: parseFloat(gradeForm.max_score),
        remarks: gradeForm.remarks,
        branch_id: user?.branch_id || null,
      };

      const response = await fetch(`${Backend.api}${Backend.examResults}`, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Grade entered successfully!');
        setOpenGradeDialog(false);
        setSelectedStudent(null);
        setSelectedExam(null);
        setGradeForm({ score: '', max_score: 100, remarks: '' });
        fetchStudentsAndGrades();
      } else {
        toast.error(data.message || 'Failed to enter grade');
      }
    } catch (error) {
      console.error('Error entering grade:', error);
      toast.error('Failed to enter grade');
    }
  };

  const handleOpenGradeDialog = (student, examId) => {
    setSelectedStudent(student);
    setSelectedExam(examId);

    // Check if grade already exists
    const existingResult = examResults.find(
      r => r.student_id === student.id && r.exam_id === examId
    );

    if (existingResult) {
      setGradeForm({
        score: existingResult.score,
        max_score: existingResult.max_score,
        remarks: existingResult.remarks || '',
      });
    } else {
      setGradeForm({ score: '', max_score: 100, remarks: '' });
    }

    setOpenGradeDialog(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Gradebook – {getClassName()}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Teacher: {user?.full_name || 'Teacher'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                if (!term || !subject || !grade) {
                  toast.error('Please select term, class, and subject first');
                  return;
                }
                setOpenExamDialog(true);
              }}
              sx={{ bgcolor: '#10b981' }}
            >
              Create Assessment
            </Button>
            <Button
              variant="outlined"
              startIcon={<AssignmentIcon />}
              onClick={() => {
                if (!term || !subject || !grade) {
                  toast.error('Please select term, class, and subject first');
                  return;
                }
                // Navigate to grade entry view (same page, just scroll or focus)
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
            >
              Grade Entry
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Term</InputLabel>
            <Select value={term} onChange={(e) => setTerm(e.target.value)} label="Term" disabled={terms.length === 0}>
              {terms.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Grade</InputLabel>
            <Select value={grade} onChange={(e) => setGrade(e.target.value)} label="Grade" disabled={classes.length === 0}>
              {classes.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.grade}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Section</InputLabel>
            <Select value={section} onChange={(e) => setSection(e.target.value)} label="Section" disabled={sections.length === 0 || !grade}>
              {sections.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Subject</InputLabel>
            <Select value={subject} onChange={(e) => setSubject(e.target.value)} label="Subject" disabled={subjects.length === 0}>
              {subjects.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Debug info */}
          <Box sx={{ ml: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, fontSize: '0.75rem' }}>
            <Typography variant="caption" display="block">
              Terms: {terms.length} | Classes: {classes.length} | Sections: {sections.length} | Subjects: {subjects.length}
            </Typography>
            <Typography variant="caption" display="block" color={term && grade && section && subject ? 'success.main' : 'error.main'}>
              Selected: {term ? '✓' : '✗'} Term, {grade ? '✓' : '✗'} Grade, {section ? '✓' : '✗'} Section, {subject ? '✓' : '✗'} Subject
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Class Average</Typography>
              <Typography variant="h4" component="div">{stats.classAverage}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Highest Score</Typography>
              <Typography variant="h4" component="div" color="success.main">{stats.highestScore}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Lowest Score</Typography>
              <Typography variant="h4" component="div" color="error.main">{stats.lowestScore}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Missing Results</Typography>
              <Typography variant="h4" component="div" color="warning.main">{stats.missingAssignments}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">Student Grades</Typography>
                <TextField
                  size="small"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : !term || !grade || !subject ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Please select term, class, and subject first
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use the dropdowns above to filter students and grades
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student Name</TableCell>
                        {exams.map(exam => (
                          <TableCell key={exam.id} align="center">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <Typography variant="subtitle2">{exam.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{exam.exam_type}</Typography>
                            </Box>
                          </TableCell>
                        ))}
                        <TableCell align="center">Total (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={exams.length + 2} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                              No students found. Please select a class, section, and subject.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((student) => (
                          <TableRow key={student.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {student.user?.full_name?.charAt(0) || 'S'}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {student.user?.full_name || 'Unknown'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    ID: {student.student_id || 'N/A'} • Section: {student.section_details?.name || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            {exams.map(exam => (
                              <TableCell key={exam.id} align="center">
                                {getExamScore(student.id, exam.id)}
                              </TableCell>
                            ))}
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                sx={{ color: getScoreColor(getStudentTotal(student.id)) }}
                              >
                                {getStudentTotal(student.id)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredStudents.length} students
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Exam Dialog */}
      <Dialog open={openExamDialog} onClose={() => setOpenExamDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Create New Assessment</Typography>
            <IconButton onClick={() => setOpenExamDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Assessment Name"
              value={examForm.name}
              onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Assessment Type</InputLabel>
              <Select
                value={examForm.exam_type}
                onChange={(e) => setExamForm({ ...examForm, exam_type: e.target.value })}
                label="Assessment Type"
              >
                <MenuItem value="Quiz">Quiz</MenuItem>
                <MenuItem value="Midterm">Midterm</MenuItem>
                <MenuItem value="Final">Final</MenuItem>
                <MenuItem value="Assignment">Assignment</MenuItem>
                <MenuItem value="Project">Project</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Start Date"
              type="date"
              value={examForm.start_date}
              onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End Date"
              type="date"
              value={examForm.end_date}
              onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Time"
                type="time"
                value={examForm.start_time}
                onChange={(e) => setExamForm({ ...examForm, start_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End Time"
                type="time"
                value={examForm.end_time}
                onChange={(e) => setExamForm({ ...examForm, end_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
            <TextField
              label="Maximum Score"
              type="number"
              value={examForm.max_score}
              onChange={(e) => setExamForm({ ...examForm, max_score: parseInt(e.target.value) || 100 })}
              fullWidth
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Description"
              value={examForm.description}
              onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExamDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateExam} disabled={!examForm.name}>
            Create Assessment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enter Grade Dialog */}
      <Dialog open={openGradeDialog} onClose={() => setOpenGradeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Enter Grade for {selectedStudent?.user?.full_name}
            </Typography>
            <IconButton onClick={() => setOpenGradeDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Score"
              type="number"
              value={gradeForm.score}
              onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Maximum Score"
              type="number"
              value={gradeForm.max_score}
              onChange={(e) => setGradeForm({ ...gradeForm, max_score: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Remarks (Optional)"
              value={gradeForm.remarks}
              onChange={(e) => setGradeForm({ ...gradeForm, remarks: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGradeDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEnterGrade}
            disabled={!gradeForm.score || !gradeForm.max_score}
          >
            Save Grade
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </Container>
  );
}
