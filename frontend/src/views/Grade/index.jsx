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
  Chip,
  Tooltip,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  TableChart as TableChartIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
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
  const [assignments, setAssignments] = useState([]);
  const [assignmentGrades, setAssignmentGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    classAverage: 0,
    highestScore: 0,
    lowestScore: 0,
    missingAssignments: 0,
  });

  // Dialog states
  const [openGradeDialog, setOpenGradeDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedBulkExam, setSelectedBulkExam] = useState(null);
  const [bulkGrades, setBulkGrades] = useState([]);
  const [bulkMaxScore, setBulkMaxScore] = useState(100);

  // Tab state for K-12 assessment types
  const [activeTab, setActiveTab] = useState(0); // 0=Exams, 1=Continuous Assessment, 2=Skills

  // Continuous Assessment (CA) states
  const [continuousAssessments, setContinuousAssessments] = useState([]);
  const [openCADialog, setOpenCADialog] = useState(false);
  const [caForm, setCaForm] = useState({
    ca_type: 'quiz',
    title: '',
    description: '',
    score: '',
    max_score: 100,
    date_given: '',
    weight: 1.0,
  });
  const [selectedCAStudent, setSelectedCAStudent] = useState(null);

  // Skills Assessment states
  const [skillsAssessments, setSkillsAssessments] = useState([]);
  const [openSkillsDialog, setOpenSkillsDialog] = useState(false);
  const [skillsForm, setSkillsForm] = useState({
    skill: 'communication',
    rating: 'G',
    comment: '',
  });
  const [selectedSkillsStudent, setSelectedSkillsStudent] = useState(null);

  // Weight Configuration - Flexible grading weights set by teacher
  const [weightConfig, setWeightConfig] = useState({
    exam: 60,      // Default 60%, but teacher can change
    ca: 20,        // Default 20%
    assignment: 10, // Default 10%
    attendance: 10, // Default 10%
  });
  const [openWeightDialog, setOpenWeightDialog] = useState(false);
  const [tempWeights, setTempWeights] = useState(weightConfig);


  const [gradeForm, setGradeForm] = useState({
    score: '',
    max_score: 100,
    remarks: '',
  });
  const [bulkSaving, setBulkSaving] = useState(false);

  const [teacherProfile, setTeacherProfile] = useState(null);
  const [teacherAssignments, setTeacherAssignments] = useState([]);

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

  // Debug: Log students data when it changes
  useEffect(() => {
    if (students.length > 0) {
      console.log('[Gradebook] Students loaded:', students.length);
      console.log('[Gradebook] First student structure:', students[0]);
      console.log('[Gradebook] First student name fields:', {
        name: students[0].name,
        user_details: students[0].user_details,
        user: students[0].user
      });
    }
  }, [students]);

  const fetchInitialData = async () => {
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Fetch teacher profile first (for branch info)
      try {
        const teacherRes = await fetch(`${Backend.api}${Backend.teacherMe}`, { headers: header });
        const teacherData = await teacherRes.json();
        if (teacherData.success) {
          setTeacherProfile(teacherData.data);
          console.log('Teacher profile loaded:', teacherData.data);
        }
      } catch (e) {
        console.error('Failed to fetch teacher profile:', e);
      }

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
        // Store full assignments data for later use
        console.log('[Grade] Storing teacher assignments:', teacherSubjects);
        console.log('[Grade] First assignment sample:', teacherSubjects[0]);
        setTeacherAssignments(teacherSubjects);

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

      // Fetch students in this class/section with query parameters
      let studentsList = [];
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('grade_id', grade);
        if (section) queryParams.append('section_id', section);

        const studentsRes = await fetch(`${Backend.api}${Backend.students}?${queryParams}`, { headers: header });
        const studentsData = await studentsRes.json();
        studentsList = studentsData.success ? studentsData.data || [] : [];
        console.log('Students from API:', studentsList.length);
      } catch (e) {
        console.error('Failed to fetch students:', e);
      }

      setStudents(studentsList);

      // Fetch exams for this class/section/subject with query parameters
      let examsList = [];
      try {
        const examsQueryParams = new URLSearchParams();
        examsQueryParams.append('class_id', grade);
        if (section) examsQueryParams.append('section_id', section);
        if (subject) examsQueryParams.append('subject_id', subject);

        const examsRes = await fetch(`${Backend.api}${Backend.exams}?${examsQueryParams}`, { headers: header });
        const examsData = await examsRes.json();
        examsList = examsData.success ? examsData.data || [] : [];
        console.log('Exams from API:', examsList.length);
      } catch (e) {
        console.error('Failed to fetch exams:', e);
      }

      setExams(examsList);

      // Fetch exam results with filters
      let resultsList = [];
      try {
        const resultsQueryParams = new URLSearchParams();
        if (grade) resultsQueryParams.append('class_id', grade);
        if (section) resultsQueryParams.append('section_id', section);
        if (subject) resultsQueryParams.append('subject_id', subject);

        const resultsRes = await fetch(`${Backend.api}${Backend.examResults}?${resultsQueryParams}`, { headers: header });

        // Check if response is JSON before parsing
        const contentType = resultsRes.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await resultsRes.text();
          console.error('[Gradebook] Exam results API returned non-JSON:', text.substring(0, 200));
          throw new Error('Invalid response format from server');
        }

        const resultsData = await resultsRes.json();
        console.log('[Grade] Full API response:', resultsData);
        resultsList = resultsData.success ? resultsData.data || [] : [];
        console.log('[Grade] Exam results extracted:', resultsList.length, resultsList);
      } catch (e) {
        console.error('Failed to fetch exam results:', e);
      }
      setExamResults(resultsList);

      // Fetch assignments for this class/section/subject
      let assignmentsList = [];
      try {
        const assignmentsQueryParams = new URLSearchParams();
        assignmentsQueryParams.append('class_id', grade);
        if (section) assignmentsQueryParams.append('section_id', section);
        if (subject) assignmentsQueryParams.append('subject_id', subject);

        const assignmentsRes = await fetch(`${Backend.api}${Backend.assignments}?${assignmentsQueryParams}`, { headers: header });
        const assignmentsData = await assignmentsRes.json();
        assignmentsList = assignmentsData.success ? assignmentsData.data || [] : [];
        console.log('[Grade] Assignments from API:', assignmentsList.length);
      } catch (e) {
        console.error('Failed to fetch assignments:', e);
      }
      setAssignments(assignmentsList);

      // Fetch assignment grades (student submissions with grades)
      let assignmentGradesList = [];
      try {
        // Fetch all student assignments for these students
        const studentIds = studentsList.map(s => s.id).join(',');
        if (studentIds) {
          const assignmentGradesQueryParams = new URLSearchParams();
          assignmentGradesQueryParams.append('student_ids', studentIds);
          if (subject) assignmentGradesQueryParams.append('subject_id', subject);

          const assignmentGradesRes = await fetch(`${Backend.api}${Backend.studentAssignments}?${assignmentGradesQueryParams}`, { headers: header });
          const assignmentGradesData = await assignmentGradesRes.json();
          assignmentGradesList = assignmentGradesData.success ? assignmentGradesData.data || [] : [];
          console.log('[Grade] Assignment grades from API:', assignmentGradesList.length);
        }
      } catch (e) {
        console.error('Failed to fetch assignment grades:', e);
      }
      setAssignmentGrades(assignmentGradesList);

      console.log('[Grade] Students:', studentsList.map(s => ({ id: s.id, name: s.name || s.full_name })));
      console.log('[Grade] Exam Results:', resultsList.map(r => ({ student: r.student, exam: r.exam, score: r.score })));
      console.log('[Grade] Assignment Grades:', assignmentGradesList.map(r => ({ student: r.student, assignment: r.assignment, grade: r.grade })));

      // Calculate statistics (combined exams + assignments)
      calculateStats(studentsList, resultsList, examsList, assignmentGradesList, assignmentsList);
    } catch (error) {
      console.error('Error in fetchStudentsAndGrades:', error);
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (studentsList, resultsList, examsList, assignmentGradesList = [], assignmentsList = []) => {
    // Combine exam results and assignment grades for calculation
    const allGrades = [
      ...resultsList.map(r => ({
        score: parseFloat(r.score) || 0,
        maxScore: parseFloat(r.max_score) || 1,
        type: 'exam'
      })),
      ...assignmentGradesList.filter(r => r.grade !== null && r.grade !== undefined).map(r => ({
        score: parseFloat(r.grade) || 0,
        maxScore: 100, // Assignments typically out of 100
        type: 'assignment'
      }))
    ];

    if (allGrades.length === 0) {
      setStats({
        classAverage: 0,
        highestScore: 0,
        lowestScore: 0,
        missingAssignments: 0,
      });
      return;
    }

    const scores = allGrades.map(g => (g.score / g.maxScore) * 100);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    // Count missing results (exams + assignments)
    const totalExpectedExams = studentsList.length * examsList.length;
    const totalExpectedAssignments = studentsList.length * assignmentsList.length;
    const totalExpected = totalExpectedExams + totalExpectedAssignments;
    const totalSubmitted = resultsList.length + assignmentGradesList.filter(r => r.grade !== null).length;
    const missing = totalExpected - totalSubmitted;

    setStats({
      classAverage: average.toFixed(0),
      highestScore: highest.toFixed(0),
      lowestScore: lowest.toFixed(0),
      missingAssignments: missing,
    });
  };

  const getStudentResults = (studentId) => {
    return examResults.filter(r => String(r.student) === String(studentId));
  };

  const getStudentAssignmentGrades = (studentId) => {
    return assignmentGrades.filter(r =>
      String(r.student?.id || r.student) === String(studentId) &&
      r.grade !== null && r.grade !== undefined
    );
  };

  const getStudentTotal = (studentId) => {
    const examResults_list = getStudentResults(studentId);
    const assignmentGrades_list = getStudentAssignmentGrades(studentId);

    // Calculate exam total
    const examTotalScore = examResults_list.reduce((sum, r) => sum + (parseFloat(r.score) || 0), 0);
    const examTotalMax = examResults_list.reduce((sum, r) => sum + (parseFloat(r.max_score) || 0), 0);

    // Calculate assignment total (assignments out of 100)
    const assignmentTotalScore = assignmentGrades_list.reduce((sum, r) => sum + (parseFloat(r.grade) || 0), 0);
    const assignmentTotalMax = assignmentGrades_list.length * 100;

    // Combined total
    const totalScore = examTotalScore + assignmentTotalScore;
    const totalMax = examTotalMax + assignmentTotalMax;

    if (totalMax === 0) return '0%';
    const percentage = ((totalScore / totalMax) * 100).toFixed(0);
    return `${percentage}%`;
  };

  const getExamScore = (studentId, examId) => {
    const result = examResults.find(r => String(r.student) === String(studentId) && String(r.exam) === String(examId));
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
          color="success"
          onClick={() => handleOpenGradeDialog(students.find(s => s.id === studentId), examId)}
        >
          <CheckIcon fontSize="small" />
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

  const filteredStudents = students.filter(student => {
    // Student serializer provides 'name' field (source='user.full_name') or user_details
    const studentName = student.name || student.user_details?.full_name || student.user?.full_name || '';
    return studentName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle Enter Grade
  const handleEnterGrade = async () => {
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Find teacher_assignment_id for this class/section/subject
      // Use assignment_id (TeacherAssignment.id) not id (Subject.id)
      const assignment = teacherAssignments.find(a =>
        a.class_id === grade &&
        (a.section_id === section || (!a.section_id && !section)) &&
        a.id === subject
      );

      if (!assignment) {
        console.log('[Grade] Available assignments:', teacherAssignments);
        console.log('[Grade] Looking for class_id:', grade, 'section_id:', section, 'subject_id:', subject);
        toast.error('Teacher assignment not found for this class/section/subject');
        return;
      }

      console.log('[Grade] Found assignment object:', assignment);
      console.log('[Grade] assignment.id (Subject ID):', assignment.id);
      console.log('[Grade] assignment.assignment_id (TeacherAssignment ID):', assignment.assignment_id);

      // Use assignment_id (the TeacherAssignment record ID)
      const teacherAssignmentId = assignment.assignment_id;
      if (!teacherAssignmentId) {
        console.error('[Grade] assignment_id missing from assignment:', assignment);
        toast.error('Assignment ID not found. Please refresh the page or contact admin.');
        return;
      }
      console.log('[Grade] Using teacherAssignmentId:', teacherAssignmentId);

      const payload = {
        student_id: selectedStudent.id,
        teacher_assignment_id: teacherAssignmentId,
        exam_id: selectedExam,
        score: parseFloat(gradeForm.score),
        max_score: parseFloat(gradeForm.max_score),
        remarks: gradeForm.remarks,
        branch_id: teacherProfile?.branch_id || null,
      };

      // Check if grade already exists to determine CREATE vs UPDATE
      const existingResult = examResults.find(
        r => String(r.student) === String(selectedStudent.id) && String(r.exam) === String(selectedExam)
      );

      const isUpdate = !!existingResult;
      const apiUrl = isUpdate
        ? `${Backend.api}${Backend.examResults}${existingResult.id}/`
        : `${Backend.api}${Backend.examResults}`;
      const method = isUpdate ? 'PUT' : 'POST';

      console.log(`[Grade] ${isUpdate ? 'Updating' : 'Creating'} grade:`, { apiUrl, method, payload });

      const response = await fetch(apiUrl, {
        method: method,
        headers: header,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('[Grade] Response:', response.status, data);

      if (response.ok && data.success) {
        toast.success(isUpdate ? 'Grade updated successfully!' : 'Grade entered successfully!');
        setOpenGradeDialog(false);
        setSelectedStudent(null);
        setSelectedExam(null);
        setGradeForm({ score: '', max_score: 100, remarks: '' });
        fetchStudentsAndGrades();
      } else {
        const errorMsg = data.message || data.detail || data.error || 'Failed to enter grade';
        toast.error(errorMsg);
        console.error('[Grade] Error response:', data);
      }
    } catch (error) {
      console.error('Error entering grade:', error);
      toast.error('Failed to enter grade');
    }
  };

  const handleOpenGradeDialog = (student, examId) => {
    setSelectedStudent(student);
    setSelectedExam(examId);

    // Find the exam to get its max_score
    const exam = exams.find(e => String(e.id) === String(examId));
    const examMaxScore = exam?.max_score || 100;

    // Check if grade already exists
    const existingResult = examResults.find(
      r => String(r.student) === String(student.id) && String(r.exam) === String(examId)
    );

    if (existingResult) {
      setGradeForm({
        score: existingResult.score,
        max_score: existingResult.max_score,
        remarks: existingResult.remarks || '',
      });
    } else {
      // Use the exam's max_score, not default 100
      setGradeForm({ score: '', max_score: examMaxScore, remarks: '' });
    }

    setOpenGradeDialog(true);
  };

  // Bulk Grade Entry Handlers
  const handleOpenBulkDialog = (exam) => {
    if (!term || !subject || !grade) {
      toast.error('Please select term, class, and subject first');
      return;
    }
    setSelectedBulkExam(exam);
    setBulkMaxScore(exam.max_score || 100);

    // Initialize bulk grades array with existing data
    const initialBulkGrades = students.map(student => {
      const existingResult = examResults.find(
        r => String(r.student) === String(student.id) && String(r.exam) === String(exam.id)
      );
      return {
        student_id: student.id,
        student_name: student.name || student.user_details?.full_name || 'Unknown',
        score: existingResult ? existingResult.score : '',
        remarks: existingResult ? (existingResult.remarks || '') : '',
      };
    });

    setBulkGrades(initialBulkGrades);
    setOpenBulkDialog(true);
  };

  const handleBulkScoreChange = (index, value) => {
    const newBulkGrades = [...bulkGrades];
    newBulkGrades[index] = { ...newBulkGrades[index], score: value };
    setBulkGrades(newBulkGrades);
  };

  const handleBulkRemarksChange = (index, value) => {
    const newBulkGrades = [...bulkGrades];
    newBulkGrades[index] = { ...newBulkGrades[index], remarks: value };
    setBulkGrades(newBulkGrades);
  };

  const handleBulkEnterGrades = async () => {
    try {
      setBulkSaving(true);
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Find teacher_assignment_id
      // Use assignment_id (TeacherAssignment.id) not id (Subject.id)
      const assignment = teacherAssignments.find(a =>
        a.class_id === grade &&
        (a.section_id === section || (!a.section_id && !section)) &&
        a.id === subject
      );

      if (!assignment) {
        toast.error('Teacher assignment not found for this class/section/subject');
        setBulkSaving(false);
        return;
      }

      const teacherAssignmentId = assignment.assignment_id;
      if (!teacherAssignmentId) {
        console.error('[Grade] assignment_id missing from assignment:', assignment);
        toast.error('Assignment ID not found. Please refresh the page.');
        setBulkSaving(false);
        return;
      }

      // Filter out empty scores and prepare results
      const resultsData = bulkGrades
        .filter(item => item.score !== '' && item.score !== null)
        .map(item => ({
          student_id: item.student_id,
          score: parseFloat(item.score),
          max_score: parseFloat(bulkMaxScore),
          remarks: item.remarks,
        }));

      if (resultsData.length === 0) {
        toast.warning('No grades to save. Please enter at least one score.');
        setBulkSaving(false);
        return;
      }

      const payload = {
        exam_id: selectedBulkExam.id,
        teacher_assignment_id: teacherAssignmentId,
        branch_id: teacherProfile?.branch_id || null,
        results: resultsData,
      };

      const response = await fetch(`${Backend.api}${Backend.examResults}bulk_create/`, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Grades saved: ${data.data.created_count} created, ${data.data.updated_count} updated`);
        if (data.data.errors && data.data.errors.length > 0) {
          data.data.errors.forEach(err => {
            toast.error(`Error for student ${err.student_id}: ${err.error}`);
          });
        }
        setOpenBulkDialog(false);
        setSelectedBulkExam(null);
        setBulkGrades([]);
        fetchStudentsAndGrades();
      } else {
        toast.error(data.message || 'Failed to save bulk grades');
      }
    } catch (error) {
      console.error('Error saving bulk grades:', error);
      toast.error('Failed to save grades: ' + error.message);
    } finally {
      setBulkSaving(false);
    }
  };

  // ==================== CONTINUOUS ASSESSMENT (CA) FUNCTIONS ====================

  const fetchContinuousAssessments = async () => {
    if (!term || !grade || !subject) return;
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}continuous_assessments/?term_id=${term}&class_id=${grade}&subject_id=${subject}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setContinuousAssessments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching CA:', error);
    }
  };

  const handleOpenCADialog = (student) => {
    setSelectedCAStudent(student);
    setCaForm({
      ca_type: 'quiz',
      title: '',
      description: '',
      score: '',
      max_score: 100,
      date_given: new Date().toISOString().split('T')[0],
      weight: 1.0,
    });
    setOpenCADialog(true);
  };

  const handleSaveCA = async () => {
    try {
      const token = await GetToken();
      const assignment = teacherAssignments.find(a =>
        a.class_id === grade && (a.section_id === section || (!a.section_id && !section)) && a.id === subject
      );
      if (!assignment?.assignment_id) {
        toast.error('Teacher assignment not found');
        return;
      }

      const payload = {
        student_id: selectedCAStudent.id,
        teacher_assignment_id: assignment.assignment_id,
        term_id: term,
        ca_type: caForm.ca_type,
        title: caForm.title,
        description: caForm.description,
        score: parseFloat(caForm.score),
        max_score: parseFloat(caForm.max_score),
        weight: parseFloat(caForm.weight),
        date_given: caForm.date_given,
      };

      const response = await fetch(`${Backend.api}continuous_assessments/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Continuous Assessment saved!');
        setOpenCADialog(false);
        fetchContinuousAssessments();
      } else {
        toast.error(data.message || 'Failed to save CA');
      }
    } catch (error) {
      console.error('Error saving CA:', error);
      toast.error('Failed to save CA');
    }
  };

  // ==================== SKILLS ASSESSMENT FUNCTIONS ====================

  const fetchSkillsAssessments = async () => {
    if (!term || !grade || !subject) return;
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.api}skills_assessments/?term_id=${term}&class_id=${grade}&subject_id=${subject}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setSkillsAssessments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleOpenSkillsDialog = (student) => {
    setSelectedSkillsStudent(student);
    setSkillsForm({
      skill: 'communication',
      rating: 'G',
      comment: '',
    });
    setOpenSkillsDialog(true);
  };

  const handleSaveSkills = async () => {
    try {
      const token = await GetToken();
      const assignment = teacherAssignments.find(a =>
        a.class_id === grade && (a.section_id === section || (!a.section_id && !section)) && a.id === subject
      );
      if (!assignment?.assignment_id) {
        toast.error('Teacher assignment not found');
        return;
      }

      const payload = {
        student_id: selectedSkillsStudent.id,
        teacher_assignment_id: assignment.assignment_id,
        term_id: term,
        skill: skillsForm.skill,
        rating: skillsForm.rating,
        comment: skillsForm.comment,
      };

      const response = await fetch(`${Backend.api}skills_assessments/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Skills Assessment saved!');
        setOpenSkillsDialog(false);
        fetchSkillsAssessments();
      } else {
        toast.error(data.message || 'Failed to save skills');
      }
    } catch (error) {
      console.error('Error saving skills:', error);
      toast.error('Failed to save skills');
    }
  };

  // Fetch CA and Skills when tab changes
  useEffect(() => {
    if (activeTab === 1) fetchContinuousAssessments();
    if (activeTab === 2) fetchSkillsAssessments();
  }, [activeTab, term, grade, subject]);

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
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<TableChartIcon />}
              onClick={() => {
                if (!term || !subject || !grade) {
                  toast.error('Please select term, class, and subject first');
                  return;
                }
                if (exams.length === 0) {
                  toast.error('No exams available. Please create an assessment first.');
                  return;
                }
                // Open bulk entry for the first exam (or show exam selector)
                handleOpenBulkDialog(exams[0]);
              }}
            >
              Bulk Entry
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => {
                setTempWeights(weightConfig);
                setOpenWeightDialog(true);
              }}
              sx={{ borderColor: '#ff9800', color: '#ff9800' }}
            >
              Weights ({weightConfig.exam}%/{weightConfig.ca}%/{weightConfig.assignment}%/{weightConfig.attendance}%)
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
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
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Term</InputLabel>
            <Select value={term} onChange={(e) => setTerm(e.target.value)} label="Term" disabled={terms.length === 0}>
              {terms.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
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

      {/* Assessment Type Tabs - K-12 Feature */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 1,
            '& .MuiTabs-flexContainer': {
              gap: 1,
            }
          }}
        >
          <Tab
            label="📋 Exam Grades"
            sx={{ fontWeight: activeTab === 0 ? 'bold' : 'normal' }}
          />
          <Tab
            label="📝 Continuous Assessment (CA)"
            sx={{ fontWeight: activeTab === 1 ? 'bold' : 'normal' }}
          />
          <Tab
            label="⭐ Skills & Competencies"
            sx={{ fontWeight: activeTab === 2 ? 'bold' : 'normal' }}
          />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  {activeTab === 0 && 'Student Grades'}
                  {activeTab === 1 && 'Continuous Assessment'}
                  {activeTab === 2 && 'Skills & Competency Assessment'}
                </Typography>
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
                        {activeTab === 0 && exams.map(exam => (
                          <TableCell key={exam.id} align="center" sx={{ minWidth: 120 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: 150 }}>
                                {exam.name}
                              </Typography>
                              <Chip
                                label={exam.exam_type?.replace('_', ' ')}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', mt: 0.5 }}
                              />
                            </Box>
                          </TableCell>
                        ))}
                        {activeTab === 0 && (
                          <TableCell align="center">
                            <Tooltip title={
                              <Typography variant="body2">
                                <strong>Calculation (Exams + Assignments):</strong><br />
                                (Exam scores + Assignment grades) ÷ (Exam max + Assignment max) × 100<br />
                                <em>Assignments are graded out of 100</em>
                              </Typography>
                            } arrow>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, cursor: 'help' }}>
                                <span>Total (%)</span>
                                <InfoIcon fontSize="small" color="action" />
                              </Box>
                            </Tooltip>
                          </TableCell>
                        )}
                        {activeTab === 1 && (
                          <>
                            <TableCell align="center">CA Count</TableCell>
                            <TableCell align="center">CA Average</TableCell>
                            <TableCell align="center">Action</TableCell>
                          </>
                        )}
                        {activeTab === 2 && (
                          <>
                            <TableCell align="center">Skills Rated</TableCell>
                            <TableCell align="center">Overall Rating</TableCell>
                            <TableCell align="center">Action</TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={activeTab === 0 ? exams.length + 2 : 4} align="center">
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
                                  {(student.name || student.user_details?.full_name || 'S').charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {student.name || student.user_details?.full_name || 'Unknown'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    ID: {student.student_id || 'N/A'} • Section: {student.section_details?.name || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            {activeTab === 0 && exams.map(exam => (
                              <TableCell key={exam.id} align="center">
                                {getExamScore(student.id, exam.id)}
                              </TableCell>
                            ))}
                            {activeTab === 0 && (
                              <TableCell align="center">
                                <Tooltip title={
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>K-12 Grade Calculation:</Typography>
                                    <Typography variant="caption" display="block">• Exam (Mid+Final): 60%</Typography>
                                    <Typography variant="caption" display="block">• Continuous Assessment: 20%</Typography>
                                    <Typography variant="caption" display="block">• Assignments: 10%</Typography>
                                    <Typography variant="caption" display="block">• Attendance: 10%</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', mt: 1 }}>Note:</Typography>
                                    <Typography variant="caption" display="block">If CA/Assignments not entered,</Typography>
                                    <Typography variant="caption" display="block">weights redistribute automatically.</Typography>
                                    <Typography variant="caption" display="block">Example: Exams only = 100%</Typography>
                                  </Box>
                                } arrow>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'help' }}>
                                    <Typography
                                      variant="body2"
                                      fontWeight="bold"
                                      sx={{ color: getScoreColor(getStudentTotal(student.id)) }}
                                    >
                                      {getStudentTotal(student.id)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {getStudentResults(student.id).length}/{exams.length} exams
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              </TableCell>
                            )}
                            {activeTab === 1 && (
                              <>
                                <TableCell align="center">
                                  {continuousAssessments.filter(ca => ca.student === student.id).length} assessments
                                </TableCell>
                                <TableCell align="center">
                                  {(() => {
                                    const studentCAs = continuousAssessments.filter(ca => ca.student === student.id);
                                    if (studentCAs.length === 0) return '-';
                                    const avg = studentCAs.reduce((sum, ca) => sum + (ca.score / ca.max_score * 100), 0) / studentCAs.length;
                                    return `${avg.toFixed(1)}%`;
                                  })()}
                                </TableCell>
                                <TableCell align="center">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleOpenCADialog(student)}
                                  >
                                    Add CA
                                  </Button>
                                </TableCell>
                              </>
                            )}
                            {activeTab === 2 && (
                              <>
                                <TableCell align="center">
                                  {skillsAssessments.filter(s => s.student === student.id).length} skills
                                </TableCell>
                                <TableCell align="center">
                                  {(() => {
                                    const studentSkills = skillsAssessments.filter(s => s.student === student.id);
                                    if (studentSkills.length === 0) return '-';
                                    const ratingMap = { EX: 5, VG: 4, G: 3, S: 2, NI: 1, U: 0 };
                                    const avg = studentSkills.reduce((sum, s) => sum + (ratingMap[s.rating] || 0), 0) / studentSkills.length;
                                    const ratingLabels = ['U', 'NI', 'S', 'G', 'VG', 'EX'];
                                    return ratingLabels[Math.round(avg)] || '-';
                                  })()}
                                </TableCell>
                                <TableCell align="center">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => handleOpenSkillsDialog(student)}
                                  >
                                    Rate Skills
                                  </Button>
                                </TableCell>
                              </>
                            )}
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

      {/* Enter Grade Dialog */}
      <Dialog open={openGradeDialog} onClose={() => setOpenGradeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Enter Grade for {selectedStudent?.name || selectedStudent?.user_details?.full_name || selectedStudent?.user?.full_name || 'Student'}
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
              label="Maximum Score (from Exam)"
              type="number"
              value={gradeForm.max_score}
              InputProps={{ readOnly: true }}
              helperText="Auto-filled from exam settings. To change, edit the exam."
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

      {/* Bulk Grade Entry Dialog */}
      <Dialog open={openBulkDialog} onClose={() => !bulkSaving && setOpenBulkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">Bulk Grade Entry</Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedBulkExam?.name} • Max Score: {bulkMaxScore}
              </Typography>
            </Box>
            <IconButton onClick={() => !bulkSaving && setOpenBulkDialog(false)} disabled={bulkSaving}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Assessment</InputLabel>
                <Select
                  value={selectedBulkExam?.id || ''}
                  onChange={(e) => {
                    const exam = exams.find(ex => ex.id === e.target.value);
                    if (exam) handleOpenBulkDialog(exam);
                  }}
                  label="Select Assessment"
                >
                  {exams.map(exam => (
                    <MenuItem key={exam.id} value={exam.id}>
                      {exam.name} ({exam.exam_type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Max Score"
                type="number"
                size="small"
                value={bulkMaxScore}
                onChange={(e) => setBulkMaxScore(parseFloat(e.target.value) || 100)}
                sx={{ width: 120 }}
                inputProps={{ min: 1 }}
              />
            </Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Enter scores for all students. Leave blank to skip.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper', width: 120 }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Remarks (Optional)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bulkGrades.map((item, index) => (
                    <TableRow key={item.student_id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.875rem' }}>
                            {item.student_name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{item.student_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.score}
                          onChange={(e) => handleBulkScoreChange(index, e.target.value)}
                          placeholder={`/${bulkMaxScore}`}
                          inputProps={{ min: 0, max: bulkMaxScore }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.remarks}
                          onChange={(e) => handleBulkRemarksChange(index, e.target.value)}
                          placeholder="Optional remarks"
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {bulkGrades.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No students found. Please select a class with students.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenBulkDialog(false)} disabled={bulkSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleBulkEnterGrades}
            disabled={bulkSaving || bulkGrades.length === 0}
            startIcon={bulkSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {bulkSaving ? 'Saving...' : `Save ${bulkGrades.filter(g => g.score !== '').length} Grades`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Continuous Assessment Entry Dialog */}
      <Dialog open={openCADialog} onClose={() => setOpenCADialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Add Continuous Assessment for {selectedCAStudent?.name || selectedCAStudent?.user_details?.full_name || 'Student'}
            </Typography>
            <IconButton onClick={() => setOpenCADialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>CA Type</InputLabel>
              <Select
                value={caForm.ca_type}
                onChange={(e) => setCaForm({ ...caForm, ca_type: e.target.value })}
                label="CA Type"
              >
                <MenuItem value="quiz">Daily Quiz</MenuItem>
                <MenuItem value="homework">Homework</MenuItem>
                <MenuItem value="participation">Class Participation</MenuItem>
                <MenuItem value="classwork">Classwork</MenuItem>
                <MenuItem value="project">Mini Project</MenuItem>
                <MenuItem value="assignment">Assignment</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Title"
              value={caForm.title}
              onChange={(e) => setCaForm({ ...caForm, title: e.target.value })}
              placeholder="e.g., Week 3 Quiz, Chapter 5 Homework"
              fullWidth
              required
            />
            <TextField
              label="Description (Optional)"
              value={caForm.description}
              onChange={(e) => setCaForm({ ...caForm, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Date Given"
              type="date"
              value={caForm.date_given}
              onChange={(e) => setCaForm({ ...caForm, date_given: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Score"
                type="number"
                value={caForm.score}
                onChange={(e) => setCaForm({ ...caForm, score: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Max Score"
                type="number"
                value={caForm.max_score}
                onChange={(e) => setCaForm({ ...caForm, max_score: e.target.value })}
                fullWidth
              />
            </Box>
            <TextField
              label="Weight (in CA calculation)"
              type="number"
              value={caForm.weight}
              onChange={(e) => setCaForm({ ...caForm, weight: e.target.value })}
              helperText="Default is 1.0. Increase for important assessments."
              fullWidth
              inputProps={{ min: 0.1, step: 0.1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCADialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveCA}
            disabled={!caForm.title || !caForm.score}
          >
            Save Assessment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Skills Assessment Entry Dialog */}
      <Dialog open={openSkillsDialog} onClose={() => setOpenSkillsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Rate Skills for {selectedSkillsStudent?.name || selectedSkillsStudent?.user_details?.full_name || 'Student'}
            </Typography>
            <IconButton onClick={() => setOpenSkillsDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Skill</InputLabel>
              <Select
                value={skillsForm.skill}
                onChange={(e) => setSkillsForm({ ...skillsForm, skill: e.target.value })}
                label="Skill"
              >
                <MenuItem value="communication">Communication Skills</MenuItem>
                <MenuItem value="teamwork">Teamwork & Collaboration</MenuItem>
                <MenuItem value="critical_thinking">Critical Thinking</MenuItem>
                <MenuItem value="creativity">Creativity & Innovation</MenuItem>
                <MenuItem value="leadership">Leadership</MenuItem>
                <MenuItem value="discipline">Discipline & Punctuality</MenuItem>
                <MenuItem value="participation">Active Participation</MenuItem>
                <MenuItem value="homework_completion">Homework Completion</MenuItem>
                <MenuItem value="respect">Respect for Others</MenuItem>
                <MenuItem value="self_confidence">Self-Confidence</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Rating</InputLabel>
              <Select
                value={skillsForm.rating}
                onChange={(e) => setSkillsForm({ ...skillsForm, rating: e.target.value })}
                label="Rating"
              >
                <MenuItem value="EX">Excellent (EX)</MenuItem>
                <MenuItem value="VG">Very Good (VG)</MenuItem>
                <MenuItem value="G">Good (G)</MenuItem>
                <MenuItem value="S">Satisfactory (S)</MenuItem>
                <MenuItem value="NI">Needs Improvement (NI)</MenuItem>
                <MenuItem value="U">Unsatisfactory (U)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Comment (Optional)"
              value={skillsForm.comment}
              onChange={(e) => setSkillsForm({ ...skillsForm, comment: e.target.value })}
              placeholder="e.g., Shows great improvement in class discussions"
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSkillsDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSaveSkills}
            disabled={!skillsForm.skill || !skillsForm.rating}
          >
            Save Rating
          </Button>
        </DialogActions>
      </Dialog>

      {/* Weight Configuration Dialog - Teacher defines custom weights */}
      <Dialog open={openWeightDialog} onClose={() => setOpenWeightDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">⚖️ Configure Grade Weights</Typography>
            <IconButton onClick={() => setOpenWeightDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Set custom weights for each component. The system will only use components that have data. Total should ideally be 100%, but the system will normalize automatically.
              </Typography>
            </Alert>

            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              Default K-12 Weights: 60% / 20% / 10% / 10%
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
              <Box>
                <Typography variant="body2" gutterBottom>📝 Exam (Mid + Final)</Typography>
                <TextField
                  type="number"
                  value={tempWeights.exam}
                  onChange={(e) => setTempWeights({ ...tempWeights, exam: parseInt(e.target.value) || 0 })}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  fullWidth
                  size="small"
                  helperText="Weight for midterm and final exam scores"
                />
              </Box>

              <Box>
                <Typography variant="body2" gutterBottom>📚 Continuous Assessment (CA)</Typography>
                <TextField
                  type="number"
                  value={tempWeights.ca}
                  onChange={(e) => setTempWeights({ ...tempWeights, ca: parseInt(e.target.value) || 0 })}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  fullWidth
                  size="small"
                  helperText="Weight for quizzes, homework, participation"
                />
              </Box>

              <Box>
                <Typography variant="body2" gutterBottom>📋 Assignments</Typography>
                <TextField
                  type="number"
                  value={tempWeights.assignment}
                  onChange={(e) => setTempWeights({ ...tempWeights, assignment: parseInt(e.target.value) || 0 })}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  fullWidth
                  size="small"
                  helperText="Weight for major assignments/projects"
                />
              </Box>

              <Box>
                <Typography variant="body2" gutterBottom>✓ Attendance</Typography>
                <TextField
                  type="number"
                  value={tempWeights.attendance}
                  onChange={(e) => setTempWeights({ ...tempWeights, attendance: parseInt(e.target.value) || 0 })}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  fullWidth
                  size="small"
                  helperText="Weight for class attendance"
                />
              </Box>
            </Box>

            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                Total Weight: {tempWeights.exam + tempWeights.ca + tempWeights.assignment + tempWeights.attendance}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                If total ≠ 100%, the system will normalize automatically. Only components with teacher-entered data will be used in calculation.
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              💡 <strong>Examples:</strong><br />
              • Exam only (80%): Teacher enters only exam scores → Exam counts 100%<br />
              • Exam (60%) + Attendance (5%): If both entered, Exam 92%, Attendance 8%<br />
              • All entered: Uses the exact weights you set above
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWeightDialog(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setWeightConfig(tempWeights);
              toast.success(`Weights updated: ${tempWeights.exam}%/${tempWeights.ca}%/${tempWeights.assignment}%/${tempWeights.attendance}%`);
              setOpenWeightDialog(false);
            }}
          >
            Save Weights
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </Container >
  );
}
