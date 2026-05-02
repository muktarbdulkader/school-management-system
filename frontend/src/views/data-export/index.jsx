import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Grid,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import { IconDownload, IconFileTypePdf, IconFileTypeXls, IconFileTypeCsv } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';

import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const DataExportPage = () => {
  const user = useSelector((state) => state.user?.user);
  const userRoles = (user?.roles || []).map(r => (typeof r === 'string' ? r : r?.name || '').toLowerCase());
  const isRestricted = userRoles.includes('student') || userRoles.includes('parent');
  const isTeacher = userRoles.includes('teacher') || user?.is_teacher;
  const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin') || user?.is_superuser || user?.is_staff;

  const [exportType, setExportType] = useState(isTeacher ? 'teacher_attendance' : 'students');

  const [format, setFormat] = useState('csv');
  const [filters, setFilters] = useState({
    branch_id: '',
    class_id: '',
    section_id: '',
    student_id: '',
    subject_id: '',
    start_date: '',
    end_date: '',
    term_id: ''
  });
  const [loading, setLoading] = useState(false);

  // Teacher dropdown data
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Load teacher assignments
  useEffect(() => {
    const loadTeacherAssignments = async () => {
      if (!isTeacher) return;
      try {
        const token = await GetToken();
        const response = await fetch(`${Backend.api}${Backend.teacherAssignmentsMaterials}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setTeacherAssignments(data.data?.classes || []);
        }
      } catch (error) {
        console.error('Error loading teacher assignments:', error);
      }
    };
    loadTeacherAssignments();
  }, [isTeacher]);

  // Load students when class/section changes
  useEffect(() => {
    const loadStudents = async () => {
      if (!isTeacher || !selectedClass) return;
      try {
        const token = await GetToken();
        let url = `${Backend.api}${Backend.teacherStudentsMaterials}?class_id=${selectedClass}`;
        if (selectedSection) {
          url += `&section_id=${selectedSection}`;
        }
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setAvailableStudents(data.data || []);
        }
      } catch (error) {
        console.error('Error loading students:', error);
      }
    };
    loadStudents();
  }, [isTeacher, selectedClass, selectedSection]);

  // Handle class selection - updates sections and resets downstream selections
  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedSection('');
    setAvailableStudents([]);
    setFilters(prev => ({ ...prev, class_id: classId, section_id: '', student_id: '' }));

    const classData = teacherAssignments.find(c => c.id === classId);
    if (classData) {
      setAvailableSections(classData.sections || []);
    }
  };

  // Handle section selection - resets student and triggers student load
  const handleSectionChange = (sectionId) => {
    setSelectedSection(sectionId);
    setAvailableStudents([]);
    setFilters(prev => ({ ...prev, section_id: sectionId, student_id: '' }));
  };

  // Handle student selection
  const handleStudentChange = (studentId) => {
    setFilters(prev => ({ ...prev, student_id: studentId }));
  };

  if (isRestricted) {
    return <Navigate to="/home" replace />;
  }

  // Admin export types
  const adminExportTypes = [
    { value: 'students', label: 'Students List', endpoint: Backend.exportStudents },
    { value: 'teachers', label: 'Teachers List', endpoint: Backend.exportTeachers },
    { value: 'attendance', label: 'Attendance Records', endpoint: Backend.exportAttendance },
    { value: 'grades', label: 'Grades Report', endpoint: Backend.exportGrades },
    { value: 'report_card', label: 'Student Report Card', endpoint: Backend.exportReportCard }
  ];

  // Teacher export types (filtered to their assigned classes)
  const teacherExportTypes = [
    { value: 'teacher_attendance', label: 'My Classes Attendance', endpoint: Backend.exportTeacherAttendance },
    { value: 'teacher_grades', label: 'My Classes Grades', endpoint: Backend.exportTeacherGrades },
    { value: 'report_card', label: 'Student Report Card', endpoint: Backend.exportReportCard }
  ];

  // Use appropriate export types based on role
  const exportTypes = isAdmin ? adminExportTypes : (isTeacher ? teacherExportTypes : adminExportTypes);

  const formats = [
    { value: 'csv', label: 'CSV', icon: <IconFileTypeCsv /> },
    { value: 'excel', label: 'Excel', icon: <IconFileTypeXls /> },
    { value: 'pdf', label: 'PDF', icon: <IconFileTypePdf /> }
  ];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const selectedType = exportTypes.find(t => t.value === exportType);

      if (!selectedType || !selectedType.endpoint) {
        toast.error('Invalid export type selected');
        setLoading(false);
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({ format });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      let url = '';

      // Special handling for report card
      if (exportType === 'report_card') {
        if (!filters.student_id) {
          toast.error('Please enter a student ID for report card');
          setLoading(false);
          return;
        }
        const endpoint = selectedType.endpoint.replace('{student_id}', filters.student_id);
        url = `${Backend.api}${endpoint}?${params.toString()}`;
      } else {
        url = `${Backend.api}${selectedType.endpoint}?${params.toString()}`;
      }

      console.log('Exporting from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json, application/octet-stream'
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('Content-Type');

        // Check if response is JSON (error) or file
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.success === false) {
            toast.error(data.message || 'Export failed');
            setLoading(false);
            return;
          }
        }

        // Get filename from Content-Disposition header or create default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `export_${exportType}_${new Date().toISOString().split('T')[0]}.${format}`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }

        // Download file
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        toast.success('Export completed successfully');
      } else {
        try {
          const error = await response.json();
          toast.error(error.message || `Export failed with status ${response.status}`);
        } catch (e) {
          toast.error(`Export failed with status ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Data Export">
      <DrogaCard>
        <Typography variant="h3" sx={{ mb: 3 }}>
          Export Data
        </Typography>

        <Grid container spacing={3}>
          {/* Export Configuration */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Export Configuration
                </Typography>

                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Export Type</InputLabel>
                    <Select
                      value={exportType}
                      label="Export Type"
                      onChange={(e) => setExportType(e.target.value)}
                    >
                      {exportTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={format}
                      label="Format"
                      onChange={(e) => setFormat(e.target.value)}
                    >
                      {formats.map(fmt => (
                        <MenuItem key={fmt.value} value={fmt.value}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {fmt.icon}
                            <span>{fmt.label}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Filters */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Filters (Optional)
                </Typography>

                <Stack spacing={2}>
                  {(exportType === 'students' || exportType === 'attendance' || exportType === 'teacher_attendance') && (
                    <TextField
                      fullWidth
                      label="Branch ID"
                      name="branch_id"
                      value={filters.branch_id}
                      onChange={handleFilterChange}
                      placeholder="Filter by branch"
                    />
                  )}

                  {(exportType === 'attendance' || exportType === 'teacher_attendance') && (
                    <>
                      {isTeacher ? (
                        // Teacher cascading dropdowns
                        <>
                          <TextField
                            fullWidth
                            select
                            label="Select Class"
                            value={selectedClass}
                            onChange={(e) => handleClassChange(e.target.value)}
                          >
                            <MenuItem value="">
                              <em>All My Classes</em>
                            </MenuItem>
                            {teacherAssignments.map((cls) => (
                              <MenuItem key={cls.id} value={cls.id}>
                                Grade {cls.grade}
                              </MenuItem>
                            ))}
                          </TextField>

                          {selectedClass && availableSections.length > 0 && (
                            <TextField
                              fullWidth
                              select
                              label="Select Section"
                              value={selectedSection}
                              onChange={(e) => handleSectionChange(e.target.value)}
                            >
                              <MenuItem value="">
                                <em>All Sections</em>
                              </MenuItem>
                              {availableSections.map((section) => (
                                <MenuItem key={section.id} value={section.id}>
                                  {section.name}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}

                          {selectedClass && availableStudents.length > 0 && (
                            <TextField
                              fullWidth
                              select
                              label="Select Student"
                              value={filters.student_id}
                              onChange={(e) => handleStudentChange(e.target.value)}
                            >
                              <MenuItem value="">
                                <em>All Students</em>
                              </MenuItem>
                              {availableStudents.map((student) => (
                                <MenuItem key={student.id} value={student.id}>
                                  {student.name} ({student.student_id || 'No ID'})
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        </>
                      ) : (
                        // Admin text fields
                        <>
                          <TextField
                            fullWidth
                            label="Class ID"
                            name="class_id"
                            value={filters.class_id}
                            onChange={handleFilterChange}
                            placeholder="Filter by class"
                          />
                          <TextField
                            fullWidth
                            label="Section ID"
                            name="section_id"
                            value={filters.section_id}
                            onChange={handleFilterChange}
                            placeholder="Filter by section (optional)"
                          />
                          <TextField
                            fullWidth
                            label="Student ID"
                            name="student_id"
                            value={filters.student_id}
                            onChange={handleFilterChange}
                            placeholder="Filter by student"
                          />
                        </>
                      )}
                    </>
                  )}

                  {exportType === 'grades' && (
                    <>
                      <TextField
                        fullWidth
                        label="Class ID"
                        name="class_id"
                        value={filters.class_id}
                        onChange={handleFilterChange}
                        placeholder="Filter by class"
                      />
                      <TextField
                        fullWidth
                        label="Section ID"
                        name="section_id"
                        value={filters.section_id}
                        onChange={handleFilterChange}
                        placeholder="Filter by section (optional)"
                      />
                      <TextField
                        fullWidth
                        label="Subject ID"
                        name="subject_id"
                        value={filters.subject_id}
                        onChange={handleFilterChange}
                        placeholder="Filter by subject (optional)"
                      />
                      <TextField
                        fullWidth
                        label="Term ID"
                        name="term_id"
                        value={filters.term_id}
                        onChange={handleFilterChange}
                        placeholder="Filter by term (optional)"
                      />
                      <TextField
                        fullWidth
                        label="Student ID"
                        name="student_id"
                        value={filters.student_id}
                        onChange={handleFilterChange}
                        placeholder="Filter by specific student"
                      />
                    </>
                  )}

                  {exportType === 'report_card' && (
                    <>
                      <TextField
                        fullWidth
                        label="Student ID"
                        name="student_id"
                        value={filters.student_id}
                        onChange={handleFilterChange}
                        required
                        placeholder="Required for report card"
                      />
                      <TextField
                        fullWidth
                        label="Term ID"
                        name="term_id"
                        value={filters.term_id}
                        onChange={handleFilterChange}
                        placeholder="Leave empty for current term"
                      />
                    </>
                  )}

                  {(exportType === 'teacher_grades') && (
                    <>
                      {isTeacher ? (
                        // Teacher cascading dropdowns for grades
                        <>
                          <TextField
                            fullWidth
                            select
                            label="Select Class"
                            value={selectedClass}
                            onChange={(e) => handleClassChange(e.target.value)}
                          >
                            <MenuItem value="">
                              <em>All My Classes</em>
                            </MenuItem>
                            {teacherAssignments.map((cls) => (
                              <MenuItem key={cls.id} value={cls.id}>
                                Grade {cls.grade}
                              </MenuItem>
                            ))}
                          </TextField>

                          {selectedClass && availableSections.length > 0 && (
                            <TextField
                              fullWidth
                              select
                              label="Select Section"
                              value={selectedSection}
                              onChange={(e) => handleSectionChange(e.target.value)}
                            >
                              <MenuItem value="">
                                <em>All Sections</em>
                              </MenuItem>
                              {availableSections.map((section) => (
                                <MenuItem key={section.id} value={section.id}>
                                  {section.name}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}

                          {selectedClass && (
                            <TextField
                              fullWidth
                              select
                              label="Select Subject"
                              value={filters.subject_id}
                              onChange={(e) => setFilters(prev => ({ ...prev, subject_id: e.target.value }))}
                            >
                              <MenuItem value="">
                                <em>All Subjects</em>
                              </MenuItem>
                              {/* Filter subjects based on selected class */}
                              {teacherAssignments
                                .filter(c => c.id === selectedClass)
                                .flatMap(c => c.subjects || [])
                                .filter((s, i, arr) => arr.findIndex(t => t.id === s.id) === i)
                                .map((subject) => (
                                  <MenuItem key={subject.id} value={subject.id}>
                                    {subject.name}
                                  </MenuItem>
                                ))}
                            </TextField>
                          )}

                          <TextField
                            fullWidth
                            label="Term ID"
                            name="term_id"
                            value={filters.term_id}
                            onChange={handleFilterChange}
                            placeholder="Filter by term (optional)"
                          />
                        </>
                      ) : (
                        // Admin text fields
                        <>
                          <TextField
                            fullWidth
                            label="Class ID"
                            name="class_id"
                            value={filters.class_id}
                            onChange={handleFilterChange}
                            placeholder="Filter by class"
                          />
                          <TextField
                            fullWidth
                            label="Section ID"
                            name="section_id"
                            value={filters.section_id}
                            onChange={handleFilterChange}
                            placeholder="Filter by section (optional)"
                          />
                          <TextField
                            fullWidth
                            label="Subject ID"
                            name="subject_id"
                            value={filters.subject_id}
                            onChange={handleFilterChange}
                            placeholder="Filter by subject (optional)"
                          />
                          <TextField
                            fullWidth
                            label="Term ID"
                            name="term_id"
                            value={filters.term_id}
                            onChange={handleFilterChange}
                            placeholder="Filter by term (optional)"
                          />
                        </>
                      )}
                    </>
                  )}

                  {(exportType === 'attendance' || exportType === 'grades' || exportType === 'teacher_attendance' || exportType === 'teacher_grades') && (
                    <>
                      <TextField
                        fullWidth
                        type="date"
                        label="Start Date"
                        name="start_date"
                        value={filters.start_date}
                        onChange={handleFilterChange}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        fullWidth
                        type="date"
                        label="End Date"
                        name="end_date"
                        value={filters.end_date}
                        onChange={handleFilterChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Export Button */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<IconDownload />}
                onClick={handleExport}
                disabled={loading}
              >
                {loading ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
              </Button>
            </Box>
          </Grid>

          {/* Export Info */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'primary.lighter' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Export Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • CSV: Best for spreadsheet applications and data analysis
                  <br />
                  • Excel: Formatted spreadsheet with multiple sheets
                  <br />
                  • PDF: Print-ready document format
                  <br />
                  <br />
                  {isTeacher && !isAdmin ? (
                    <>Teachers can only export data for their assigned classes and subjects.</>
                  ) : (
                    <>Exports include all visible data based on your filters and permissions.</>
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DrogaCard>
      <ToastContainer />
    </PageContainer>
  );
};

export default DataExportPage;
