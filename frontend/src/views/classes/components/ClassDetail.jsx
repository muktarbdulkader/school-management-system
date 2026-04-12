import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import StudentList from './Studentslists';
import AttendanceCalendar from './AttendanceCalendar';
import AssignmentsDashboard from './TeacherAssignments';
import AddButton from 'ui-component/buttons/AddButton';
import BehaviorWellbeingTable from './BehaviorAndWellbeing';
import PerformanceDashboard from './PerformanceAnalytic';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import AttendanceChart from './AttendanceGraph';
import LessonPlanningPanel from './LessonPlanningPanel';

const ClassDetail = () => {
  const location = useLocation();
  const { classId, sectionId, subjectId } = useParams();
  const stateData = location.state || {};
  
  const [classData, setClassData] = useState(stateData.classData || {
    class_id: classId,
    section_id: sectionId === 'null' ? null : sectionId,
    id: subjectId,
    name: stateData.classData?.name || 'Class'
  });

  const [attendanceData, setAttendanceData] = useState(stateData.attendanceData);
  const [summaryData, setSummaryData] = useState([]);
  const [studentsData, setStudentsData] = useState([]);
  const [studentStats, setStudentStats] = useState(null);
  const [assignmentsData, setAssignmentsData] = useState([]);
  const [behaviorNotesData, setBehaviorNotesData] = useState([]);
  const [assessmentsData, setAssessmentsData] = useState([]);
  const [assessmentsSummary, setAssessmentsSummary] = useState(null);
  const [openAssessmentDialog, setOpenAssessmentDialog] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    name: '',
    exam_type: 'midterm',
    start_date: '',
    end_date: '',
    description: '',
    max_score: 100
  });
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');

  const [headerData, setHeaderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attendanceData) {
      setSummaryData(Array.isArray(attendanceData.summary_cards) ? attendanceData.summary_cards : []);
      setStudentsData(attendanceData.students?.list || []);
      setStudentStats(attendanceData.students?.stats || {});
      setAssignmentsData(attendanceData.assignments || []);
      setBehaviorNotesData(attendanceData.behavior_notes || []);
      setHeaderData(attendanceData.header);
      setLoading(false);
      fetchAssessments();
    } else if (classData) {
      fetchAttendanceData();
      fetchAssessments();
    } else {
      setDefaultData();
      setLoading(false);
    }
  }, [classData, attendanceData]);

  // const fetchAttendanceData = async () => {
  //   try {
  //     const token = await GetToken();
  //     const Api = `${Backend.auth}${Backend.teachersClassDashboard}/${classData.class_id}/${classData.section_id}/${classItem.id}`;
  //     const header = {
  //       Authorization: `Bearer ${token}`,
  //       accept: 'application/json',
  //       'Content-Type': 'application/json',
  //     };

  //     const response = await fetch(Api, { method: 'GET', headers: header });
  //     const responseData = await response.json();

  //     if (responseData.success) {
  //       setSummaryData(responseData.data.summary);
  //       setStudentsData(responseData.data.students);
  //       setStudentStats(responseData.data.students?.stats || {});
  //       setAssignmentsData(attendanceData.assignments || []);
  //       setBehaviorNotesData(attendanceData.behavior_notes || []);
  //       setHeaderData(responseData.data.header);
  //     } else {
  //       toast.warning(responseData.message);
  //       setDefaultData();
  //     }
  //   } catch (error) {
  //     toast.error(error.message);
  //     setDefaultData();
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchAttendanceData = async () => {
    try {
      const token = await GetToken();
      // Replace classItem.id with classData.id
      const Api = `${Backend.auth}${Backend.teachersClassDashboard}/${classData.class_id}/${classData.section_id}/${classData.id}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      console.log('Fetched Attendance Data:', responseData);
      if (responseData.success) {
        setSummaryData(Array.isArray(responseData.data.summary_cards) ? responseData.data.summary_cards : []);
        setStudentsData(responseData.data?.students?.list || []);
        setStudentStats(responseData.data?.students?.stats || {});
        setAssignmentsData(responseData.data?.assignments || []);
        setBehaviorNotesData(responseData.data?.behavior_notes || []);
        setHeaderData(responseData.data?.header);
        
        // Update classData with ID-compatible fields
        setClassData(prev => ({
          ...prev,
          name: responseData.data?.class?.name,
          class_id: responseData.data?.class?.id,
          section_id: responseData.data?.section?.id,
          branch_id: responseData.data?.class?.branch_id
        }));
      } else {
        toast.warning(responseData.message);
        setDefaultData();
      }
    } catch (error) {
      toast.error(error.message);
      setDefaultData();
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async () => {
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.teachersClassAssessments}/${classData.class_id}/${classData.section_id}/${classData.id}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      console.log('Fetched Assessments Data:', responseData);
      
      if (responseData.success) {
        setAssessmentsData(responseData.data.assessments || []);
        setAssessmentsSummary(responseData.data.summary || {});
      } else {
        console.warn('Failed to fetch assessments:', responseData.message);
        setAssessmentsData([]);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setAssessmentsData([]);
    }
  };

  const fetchTerms = async () => {
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.terms}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      
      if (responseData.success) {
        setTerms(responseData.data || []);
        // Set current term as default
        const currentTerm = responseData.data.find(t => t.is_current);
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
        }
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const handleOpenAssessmentDialog = () => {
    fetchTerms();
    setOpenAssessmentDialog(true);
  };

  const handleCloseAssessmentDialog = () => {
    setOpenAssessmentDialog(false);
    setAssessmentForm({
      name: '',
      exam_type: 'midterm',
      start_date: '',
      end_date: '',
      description: '',
      max_score: 100
    });
  };

  const handleAssessmentFormChange = (e) => {
    const { name, value } = e.target;
    setAssessmentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateAssessment = async () => {
    try {
      if (!assessmentForm.name || !assessmentForm.start_date || !assessmentForm.end_date || !selectedTerm) {
        toast.error('Please fill in all required fields');
        return;
      }

      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.exams}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const payload = {
        name: assessmentForm.name,
        term_id: selectedTerm,
        exam_type: assessmentForm.exam_type,
        subject_id: classData.id,
        class_id: classData.class_id,
        section_id: classData.section_id !== 'null' ? classData.section_id : null,
        start_date: assessmentForm.start_date,
        end_date: assessmentForm.end_date,
        description: assessmentForm.description,
        branch_id: classData.branch_id || null
      };

      console.log('Creating assessment:', payload);

      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      console.log('Create assessment response:', responseData);

      if (responseData.success) {
        toast.success('Assessment created successfully!');
        handleCloseAssessmentDialog();
        fetchAssessments(); // Refresh the list
      } else {
        toast.error(responseData.message || 'Failed to create assessment');
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error('Failed to create assessment');
    }
  };

  const refreshAssignments = async () => {
    try {
      const token = await GetToken();
      // Replace classItem.id with classData.id
      const Api = `${Backend.auth}${Backend.teachersClassDashboard}/${classData.class_id}/${classData.section_id}/${classData.id}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setAssignmentsData(responseData.data.assignments || []);
      }
    } catch (error) {
      console.error('Error refreshing assignments:', error);
    }
  };

  const setDefaultData = () => {
    setSummaryData([
      { title: 'Total Students', value: 0, color: '#2196F3' },
      { title: 'Present', value: 0, color: '#4CAF50' },
      { title: 'Absent', value: 0, color: '#F44336' },
      { title: 'Late', value: 0, color: '#FF9800' }
    ]);
    setStudentsData([]);
    setAssignmentsData([]);
    setBehaviorNotesData([]);
    setHeaderData({
      section_name: classData?.class_section || 'Section',
      date: new Date().toISOString().split('T')[0],
      schedule: 'Not available',
    });
  };

  // Transform the summary_cards data into kpiData format
  const kpiData = Array.isArray(summaryData) && summaryData.length > 0
    ? summaryData.map((card, index) => {
        let color = '#2196F3'; // default blue
        let subtitle = '';

        switch (card.title) {
          case 'Class Average':
            color = '#4CAF50';
            subtitle = card.change
              ? `Trend: ${card.change}`
              : 'Overall performance';
            break;
          case 'Attendance Rate':
            color = '#FF9800';
            subtitle = 'Student attendance rate';
            break;
          case 'Assignment Completion':
            color = '#9C27B0';
            subtitle = 'Completed assignments';
            break;
          default:
            subtitle = card.title;
        }

        return {
          title: card.title,
          value: card.value,
          color: color,
          subtitle: subtitle,
          change: card.change,
          change_positive: card.change_positive,
        };
      })
    : [];

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
        <Typography>Loading class data...</Typography>
      </Box>
    );
  }
  console.log('KPI Data:', kpiData, summaryData);
  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box position="static">
        <Toolbar>
          <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
            {classData?.name || 'Class'} -{' '}
            {headerData?.section_name || classData?.class_section || 'Section'}
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              {headerData?.date || new Date().toISOString().split('T')[0]}
            </Typography>
          </Typography>
          {/* <AddButton title="Edit Class Info" /> */}
        </Toolbar>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {kpiData.map((kpi, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="body2"
                  >
                    {kpi.title}
                  </Typography>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{ color: kpi.color, fontWeight: 600 }}
                  >
                    {kpi.value}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {kpi.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Students Table */}
        <Grid item xs={12} lg={10} sx={{ mb: 4 }}>
          {/* <StudentList students={studentsData} /> */}

          <StudentList
            students={studentsData}
            classId={classData?.class_id}
            sectionId={classData?.section_id}
            studentStats={studentStats}
            sx={{ mb: 4 }}
          />
        </Grid>

        {/* <Grid sx={{ mb: 4 }}>
          <AttendanceCalendar
            studentsData={studentsData}
            classData={classData}
            headerData={headerData}
            subjectId={subjectId}
          />
        </Grid> */}

        <Grid sx={{ mb: 4 }}>
          <AttendanceChart
            studentsData={studentsData}
            classData={classData}
            headerData={headerData}
            subjectId={subjectId}
          />
        </Grid>
        <Grid sx={{ mb: 4 }}>
          {/* <AssignmentsDashboard assignmentsData={assignmentsData} /> */}
          <AssignmentsDashboard
            assignmentsData={assignmentsData}
            refreshAssignments={refreshAssignments}
          />
        </Grid>

        <Grid sx={{ mb: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Assessments & Exams
                </Typography>
                <AddButton 
                  title="Add Assessment" 
                  onPress={handleOpenAssessmentDialog}
                />
              </Box>
              
              {assessmentsData.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="textSecondary">
                    No assessments found for this class
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {assessmentsData.map((assessment) => (
                    <Grid item xs={12} md={6} key={assessment.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {assessment.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {assessment.exam_type_display}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: assessment.status === 'completed' ? '#e8f5e9' : '#fff3e0',
                                color: assessment.status === 'completed' ? '#2e7d32' : '#f57c00'
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {assessment.status === 'completed' ? 'Completed' : 'Active'}
                              </Typography>
                            </Box>
                          </Box>

                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">
                                Start Date
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {assessment.start_date}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">
                                End Date
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {assessment.end_date}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="textSecondary">
                                Submitted
                              </Typography>
                              <Typography variant="h6" color="primary">
                                {assessment.submitted}/{assessment.total_students}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="textSecondary">
                                Average
                              </Typography>
                              <Typography variant="h6" color="success.main">
                                {assessment.average_score}/{assessment.max_score}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="textSecondary">
                                Pass Rate
                              </Typography>
                              <Typography variant="h6" color="info.main">
                                {assessment.pass_rate}%
                              </Typography>
                            </Grid>
                          </Grid>

                          {assessment.description && (
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                              {assessment.description}
                            </Typography>
                          )}

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <AddButton 
                              title="View Results" 
                              onPress={() => navigate('/grades', { 
                                state: { 
                                  classId: classData.class_id, 
                                  sectionId: classData.section_id, 
                                  subjectId: classData.id,
                                  termId: assessment.term_id
                                } 
                              })}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Add Assessment Dialog */}
        <Dialog open={openAssessmentDialog} onClose={handleCloseAssessmentDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Assessment</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Assessment Name"
                name="name"
                value={assessmentForm.name}
                onChange={handleAssessmentFormChange}
                sx={{ mb: 2 }}
                required
              />

              <TextField
                fullWidth
                select
                label="Term"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                sx={{ mb: 2 }}
                required
              >
                {terms.map((term) => (
                  <MenuItem key={term.id} value={term.id}>
                    {term.name} {term.is_current ? '(Current)' : ''}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                select
                label="Assessment Type"
                name="exam_type"
                value={assessmentForm.exam_type}
                onChange={handleAssessmentFormChange}
                sx={{ mb: 2 }}
                required
              >
                <MenuItem value="midterm">Midterm Exam</MenuItem>
                <MenuItem value="final">Final Exam</MenuItem>
                <MenuItem value="quiz">Quiz</MenuItem>
                <MenuItem value="test">Test</MenuItem>
                <MenuItem value="practical">Practical</MenuItem>
                <MenuItem value="project">Project</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    name="start_date"
                    value={assessmentForm.start_date}
                    onChange={handleAssessmentFormChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    name="end_date"
                    value={assessmentForm.end_date}
                    onChange={handleAssessmentFormChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                type="number"
                label="Maximum Score"
                name="max_score"
                value={assessmentForm.max_score}
                onChange={handleAssessmentFormChange}
                sx={{ mb: 2 }}
                inputProps={{ min: 1 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description (Optional)"
                name="description"
                value={assessmentForm.description}
                onChange={handleAssessmentFormChange}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssessmentDialog}>Cancel</Button>
            <Button onClick={handleCreateAssessment} variant="contained">
              Create Assessment
            </Button>
          </DialogActions>
        </Dialog>

        <Grid sx={{ mb: 4 }}>
          <PerformanceDashboard />
        </Grid>

        <Grid sx={{ mb: 4 }}>
          <LessonPlanningPanel classData={classData} />
        </Grid>

        <Grid sx={{ mb: 4 }}>
          <BehaviorWellbeingTable behaviorNotesData={behaviorNotesData} />
        </Grid>

        <Grid container spacing={3}>
          {/* Calendar/Schedule
          <Grid item xs={12} lg={5}>
            <Card
              sx={{
                height: 300,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <CardContent sx={{ color: 'white', height: '100%' }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Schedule
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 1,
                    mb: 2,
                  }}
                >
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <Box key={index} sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="body2">{day}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 1,
                  }}
                >
                  {Array.from({ length: 35 }, (_, i) => (
                    <Box
                      key={i}
                      sx={{
                        textAlign: 'center',
                        p: 1,
                        bgcolor:
                          i % 7 === 0 || i % 7 === 6
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(255,255,255,0.2)',
                        borderRadius: 1,
                        cursor: 'pointer',
                      }}
                    >
                      <Typography variant="body2">{(i % 31) + 1}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid> */}

          {/* Performance Analytics */}

          {/* Recent Activities */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Recent Activities
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        New Assignment Posted
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Algebra Problem Set #4 has been posted for Grade 8A
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        2 hours ago
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Quiz Results Available
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Geometry Quiz results are now available for review
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        1 day ago
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Parent-Teacher Conference
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Scheduled meetings for next week are now available
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        3 days ago
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ClassDetail;
