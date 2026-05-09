from django.db import models
from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.utils import timezone
from students.models import Student
from teachers.models import Teacher
from schedule.models import Attendance
from academics.models import Term
from .exports import PDFExporter, ExcelExporter, CSVExporter
from .models import ResourceRequest, ResourceRequestItem, DigitalResource
from .serializers import (
    ResourceRequestSerializer,
    ResourceRequestCreateSerializer,
    ResourceRequestUpdateSerializer,
    ResourceRequestApprovalSerializer,
    ResourceRequestItemSerializer,
    DigitalResourceSerializer
)
def role_required(allowed_roles):
    """
    Decorator to check if user has required roles
    """
    def decorator(view_func):
        @permission_classes([IsAuthenticated])
        def _wrapped_view(request, *args, **kwargs):
            user = request.user
            user_roles = [r.role.name.lower() for r in user.userrole_set.all().select_related('role')]

            # Allow superuser and staff
            if user.is_superuser or user.is_staff:
                return view_func(request, *args, **kwargs)

            # Allow specified roles
            if any(role in user_roles for role in allowed_roles):
                return view_func(request, *args, **kwargs)

            return Response({
                'success': False,
                'message': 'You do not have permission to perform this action',
                'status': 403
            }, status=status.HTTP_403_FORBIDDEN)
        return _wrapped_view
    return decorator

ALLOWED_EXPORT_ROLES = ['admin', 'super_admin', 'head_admin', 'ceo', 'analyst', 'finance', 'hr', 'tlh', 'teacher', 'staff', 'librarian']

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_students(request):
    """Export students list"""
    user = request.user
    user_roles = [r.role.name.lower() for r in user.userrole_set.all().select_related('role')]

    # Check if student or parent
    if any(role in ['student', 'parent'] for role in user_roles) and not user.is_staff and not user.is_superuser:
        return Response({'success': False, 'message': 'Access denied', 'status': 403}, status=403)
    format_type = request.query_params.get('format', 'csv')
    branch_id = request.query_params.get('branch_id')

    students = Student.objects.all()
    if branch_id:
        students = students.filter(branch_id=branch_id)

    if not students.exists():
        return Response({'success': False, 'message': 'No students found matching the criteria'}, status=200)

    students = students.select_related('user', 'grade', 'section')

    headers = ['Student ID', 'Full Name', 'Email', 'Grade', 'Section', 'Date of Birth', 'Status']
    data = [
        [
            s.student_id or str(s.id)[:8].upper(),
            s.user.full_name,
            s.user.email,
            s.grade.grade if s.grade else 'N/A',
            s.section.name if s.section else 'N/A',
            s.birth_date.strftime('%Y-%m-%d') if s.birth_date else 'N/A',
            'Active' if s.user.is_active else 'Inactive'
        ]
        for s in students
    ]

    if format_type == 'pdf':
        buffer = PDFExporter.export_list_to_pdf('Students List', headers, data)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="students_{timezone.now().strftime("%Y%m%d")}.pdf"'
        return response

    elif format_type == 'excel':
        buffer = ExcelExporter.export_to_excel('Students List', headers, data, 'Students')
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="students_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        return response

    else:  # CSV
        csv_data = CSVExporter.export_to_csv(headers, data)
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="students_{timezone.now().strftime("%Y%m%d")}.csv"'
        return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_teachers(request):
    """Export teachers list"""
    user = request.user
    user_roles = [r.role.name.lower() for r in user.userrole_set.all().select_related('role')]

    # Check if student or parent
    # Check if student or parent
    if any(role in ['student', 'parent'] for role in user_roles) and not user.is_staff and not user.is_superuser:
        return Response({'success': False, 'message': 'Access denied', 'status': 403}, status=403)

    from teachers.models import TeacherAssignment

    format_type = request.query_params.get('format', 'csv')

    teachers = Teacher.objects.all().select_related('user')

    if not teachers.exists():
        return Response({'success': False, 'message': 'No teachers found in the system'}, status=200)

    headers = ['Teacher ID', 'Full Name', 'Email', 'Subject Specialties', 'Status']
    data = []

    for t in teachers:
        # Get subjects taught by this teacher
        subjects = TeacherAssignment.objects.filter(teacher=t).select_related('subject')
        unique_subjects = set()
        for s in subjects:
            if s.subject:
                unique_subjects.add(s.subject.name)

        subject_list = ', '.join(sorted(unique_subjects)) if unique_subjects else (t.subject_specialties if t.subject_specialties else 'Not Assigned')

        data.append([
            t.teacher_id or str(t.id)[:8].upper(),
            t.user.full_name,
            t.user.email,
            subject_list,
            'Active' if t.user.is_active else 'Inactive'
        ])

    if format_type == 'pdf':
        buffer = PDFExporter.export_list_to_pdf('Teachers List', headers, data)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="teachers_{timezone.now().strftime("%Y%m%d")}.pdf"'
        return response

    elif format_type == 'excel':
        buffer = ExcelExporter.export_to_excel('Teachers List', headers, data, 'Teachers')
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="teachers_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        return response

    else:  # CSV
        csv_data = CSVExporter.export_to_csv(headers, data)
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="teachers_{timezone.now().strftime("%Y%m%d")}.csv"'
        return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_attendance(request):
    """Export attendance records"""
    user = request.user
    user_roles = [r.role.name.lower() for r in user.userrole_set.all().select_related('role')]

    # Check if student or parent
    if any(role in ['student', 'parent'] for role in user_roles) and not user.is_staff and not user.is_superuser:
        return Response({'success': False, 'message': 'Access denied', 'status': 403}, status=403)

    format_type = request.query_params.get('format', 'csv')
    student_id = request.query_params.get('student_id')
    class_id = request.query_params.get('class_id')
    section_id = request.query_params.get('section_id')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    attendance = Attendance.objects.all().select_related('student_id__user')

    if section_id:
        attendance = attendance.filter(student_id__section_id=section_id)

    if student_id:
        attendance = attendance.filter(student_id=student_id)
    if class_id:
        attendance = attendance.filter(student_id__grade_id=class_id)
    if start_date:
        attendance = attendance.filter(date__gte=start_date)
    if end_date:
        attendance = attendance.filter(date__lte=end_date)

    if not attendance.exists():
        return Response({'success': False, 'message': 'No attendance records found for the selected criteria'}, status=200)

    headers = ['Student ID', 'Student Name', 'Date', 'Status']
    data = [
        [
            a.student_id.student_id or str(a.student_id.id)[:8].upper(),
            a.student_id.user.full_name,
            a.date.strftime('%Y-%m-%d'),
            a.status
        ]
        for a in attendance
    ]

    if format_type == 'pdf':
        buffer = PDFExporter.export_list_to_pdf('Attendance Records', headers, data)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="attendance_{timezone.now().strftime("%Y%m%d")}.pdf"'
        return response

    elif format_type == 'excel':
        buffer = ExcelExporter.export_to_excel('Attendance Records', headers, data, 'Attendance')
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="attendance_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        return response

    else:  # CSV
        csv_data = CSVExporter.export_to_csv(headers, data)
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="attendance_{timezone.now().strftime("%Y%m%d")}.csv"'
        return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_report_card(request, student_id):
    """Generate student report card PDF"""
    user = request.user
    user_roles = [r.role.name.lower() for r in user.userrole_set.all().select_related('role')]

    # Parents can only export their own children's report cards
    if 'parent' in user_roles and not user.is_staff and not user.is_superuser:
        from students.models import Parent
        try:
            parent = Parent.objects.get(user=user)
            from students.models import ParentStudent
            if not ParentStudent.objects.filter(parent=parent, student_id=student_id).exists():
                return Response({'success': False, 'message': 'Access denied to this student', 'status': 403}, status=403)
        except Parent.DoesNotExist:
            return Response({'success': False, 'message': 'Parent profile not found', 'status': 403}, status=403)

    # Students can only export their own report cards
    if 'student' in user_roles and not user.is_staff and not user.is_superuser:
        try:
            student = Student.objects.get(user=user)
            if str(student.id) != str(student_id):
                return Response({'success': False, 'message': 'Access denied to this report card', 'status': 403}, status=403)
        except Student.DoesNotExist:
            return Response({'success': False, 'message': 'Student profile not found', 'status': 403}, status=403)

    from lessontopics.models import ExamResults

    term_id = request.query_params.get('term_id')

    from django.core.exceptions import ValidationError
    try:
        # Support both UUID and ID string
        student = Student.objects.select_related('user', 'grade', 'section').get(id=student_id)
    except (Student.DoesNotExist, ValidationError):
        return Response({'success': False, 'message': f'Student with ID {student_id} not found or invalid'}, status=200)

    try:
        # Get the current/active term
        current_term = Term.objects.filter(is_current=True).first()
        if not current_term:
            # Fallback to the term_id from query params or most recent term
            if term_id:
                current_term = Term.objects.filter(id=term_id).first()
            if not current_term:
                current_term = Term.objects.order_by('-start_date').first()
        
        if not current_term:
            return Response({'success': False, 'message': 'No term found'}, status=200)

        # Get grades from ExamResults
        grades = ExamResults.objects.filter(
            student_id=student,
            exam_id__term_id=current_term
        ).select_related('subject_id', 'exam_id')

        # Get attendance data
        attendance_records = Attendance.objects.filter(
            student_id=student,
            date__gte=current_term.start_date,
            date__lte=current_term.end_date
        )

        if not attendance_records.exists():
            return Response({'success': False, 'message': 'No attendance records found for the selected period'}, status=200)

        total_days = attendance_records.count()
        days_present = attendance_records.filter(status='present').count()
        days_absent = total_days - days_present
        percentage = (days_present / total_days * 100) if total_days > 0 else 0

        attendance_data = {
            'total_days': total_days,
            'days_present': days_present,
            'days_absent': days_absent,
            'percentage': percentage
        }

        # Generate PDF
        buffer = PDFExporter.export_report_card(student, current_term, grades, attendance_data)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="report_card_{student.user.full_name}_{current_term.name}.pdf"'
        return response

    except Exception as e:
        return Response({'success': False, 'message': f'Error generating report card: {str(e)}'}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_grades(request):
    """Export grades"""
    user = request.user
    user_roles = [r.role.name.lower() for r in user.userrole_set.all().select_related('role')]

    # Check if student or parent
    if any(role in ['student', 'parent'] for role in user_roles) and not user.is_staff and not user.is_superuser:
        return Response({'success': False, 'message': 'Access denied', 'status': 403}, status=403)

    from lessontopics.models import ExamResults

    format_type = request.query_params.get('format', 'csv')
    term_id = request.query_params.get('term_id')
    class_id = request.query_params.get('class_id')
    section_id = request.query_params.get('section_id')
    student_id = request.query_params.get('student_id')
    subject_id = request.query_params.get('subject_id')

    # Fetch exam results
    results = ExamResults.objects.all().select_related(
        'student_id__user',
        'subject_id',
        'exam_id'
    )

    if term_id:
        results = results.filter(exam_id__term_id=term_id)
    if class_id:
        results = results.filter(student_id__grade_id=class_id)
    if section_id:
        results = results.filter(student_id__section_id=section_id)
    if student_id:
        results = results.filter(student_id=student_id)
    if subject_id:
        results = results.filter(models.Q(subject_id=subject_id) | models.Q(teacher_assignment__subject_id=subject_id))

    if not results.exists():
        return Response({'success': False, 'message': 'No grades found matching the criteria'}, status=200)

    headers = ['Student', 'Subject', 'Exam', 'Score', 'Grade', 'Date']
    data = [
        [
            r.student_id.user.full_name,
            r.subject_id.name if r.subject_id else 'N/A',
            r.exam_id.name if r.exam_id else 'N/A',
            str(r.score) if hasattr(r, 'score') else 'N/A',
            r.grade if hasattr(r, 'grade') else 'N/A',
            r.exam_id.date.strftime('%Y-%m-%d') if r.exam_id and hasattr(r.exam_id, 'date') else 'N/A'
        ]
        for r in results
    ]

    if format_type == 'pdf':
        buffer = PDFExporter.export_list_to_pdf('Grades Report', headers, data)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="grades_{timezone.now().strftime("%Y%m%d")}.pdf"'
        return response

    elif format_type == 'excel':
        buffer = ExcelExporter.export_to_excel('Grades Report', headers, data, 'Grades')
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="grades_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        return response

    else:  # CSV
        csv_data = CSVExporter.export_to_csv(headers, data)
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="grades_{timezone.now().strftime("%Y%m%d")}.csv"'
        return response


class ResourceRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing resource requests
    """
    queryset = ResourceRequest.objects.all().select_related('requested_by', 'approved_by').prefetch_related('items')
    serializer_class = ResourceRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset

        # Admins, Staff, CEOs see all requests
        user_role_names = list(user.userrole_set.values_list('role__name', flat=True))
        is_admin = user.is_superuser or user.is_staff or any(r.lower() in ['admin', 'super_admin', 'ceo', 'head_admin'] for r in user_role_names)

        if is_admin:
            return queryset

        # Regular users only see their own requests
        return queryset.filter(requested_by=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return ResourceRequestCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ResourceRequestUpdateSerializer
        elif self.action == 'approve_reject':
            return ResourceRequestApprovalSerializer
        return ResourceRequestSerializer

    def create(self, request, *args, **kwargs):
        """Create a new resource request - any authenticated user can create"""
        # All authenticated users can create resource requests
        # Approval is restricted to admins via approve_reject action
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resource_request = serializer.save(requested_by=request.user)

        response_serializer = ResourceRequestSerializer(resource_request)
        return Response({
            'success': True,
            'message': 'Resource request created successfully',
            'status': status.HTTP_201_CREATED,
            'data': response_serializer.data
        }, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        """List all resource requests with filters"""
        queryset = self.filter_queryset(self.get_queryset())

        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by request type
        request_type = request.query_params.get('request_type')
        if request_type:
            queryset = queryset.filter(request_type=request_type)

        # Filter by priority
        priority = request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)

        # Filter by department
        department = request.query_params.get('department')
        if department:
            queryset = queryset.filter(department__icontains=department)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': status.HTTP_200_OK,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='approve-reject')
    def approve_reject(self, request, pk=None):
        """Approve or reject a resource request"""
        resource_request = self.get_object()
        user = request.user

        # Check permissions - only Admin, CEO, etc. can approve
        user_role_names = list(user.userrole_set.values_list('role__name', flat=True))
        is_admin = user.is_superuser or user.is_staff or any(r.lower() in ['admin', 'super_admin', 'ceo', 'head_admin'] for r in user_role_names)

        if not is_admin:
            return Response({
                'success': False,
                'message': 'Only administrators can approve or reject resource requests',
                'status': status.HTTP_403_FORBIDDEN
            }, status=status.HTTP_403_FORBIDDEN)

        if user == resource_request.requested_by and not user.is_superuser:
            return Response({
                'success': False,
                'message': 'You cannot approve or reject your own resource request',
                'status': status.HTTP_403_FORBIDDEN
            }, status=status.HTTP_403_FORBIDDEN)

        if resource_request.status != 'pending':
            return Response({
                'success': False,
                'message': 'Request has already been processed',
                'status': status.HTTP_400_BAD_REQUEST
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        rejection_reason = serializer.validated_data.get('rejection_reason', '')
        notes = serializer.validated_data.get('notes', '')

        resource_request.status = new_status
        resource_request.approved_by = request.user

        if new_status == 'rejected':
            resource_request.rejection_reason = rejection_reason

        if notes:
            resource_request.notes = f"{resource_request.notes}\n\n{notes}" if resource_request.notes else notes

        resource_request.save()

        response_serializer = ResourceRequestSerializer(resource_request)
        return Response({
            'success': True,
            'message': f'Request {new_status} successfully',
            'status': status.HTTP_200_OK,
            'data': response_serializer.data
        })

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark request as completed"""
        resource_request = self.get_object()
        user = request.user

        # Check permissions
        from users.models import has_model_permission
        if not has_model_permission(user, 'resourcerequest', 'change'):
            return Response({
                'success': False,
                'message': 'You do not have permission to mark resource requests as completed',
                'status': status.HTTP_403_FORBIDDEN
            }, status=status.HTTP_403_FORBIDDEN)

        if resource_request.status != 'approved':
            return Response({
                'success': False,
                'message': 'Only approved requests can be completed',
                'status': status.HTTP_400_BAD_REQUEST
            }, status=status.HTTP_400_BAD_REQUEST)

        resource_request.status = 'completed'
        resource_request.completed_at = timezone.now()
        resource_request.save()

        response_serializer = ResourceRequestSerializer(resource_request)
        return Response({
            'success': True,
            'message': 'Request marked as completed',
            'status': status.HTTP_200_OK,
            'data': response_serializer.data
        })

    @action(detail=False, methods=['get'], url_path='my-requests')
    def my_requests(self, request):
        """Get requests created by current user"""
        queryset = self.get_queryset().filter(requested_by=request.user)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': status.HTTP_200_OK,
            'data': serializer.data
        })

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending requests"""
        queryset = self.get_queryset().filter(status='pending')

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': status.HTTP_200_OK,
            'data': serializer.data
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get resource request statistics"""
        # Get the base queryset once to avoid multiple queries
        base_queryset = self.get_queryset()

        total = base_queryset.count()
        pending = base_queryset.filter(status='pending').count()
        approved = base_queryset.filter(status='approved').count()
        rejected = base_queryset.filter(status='rejected').count()
        completed = base_queryset.filter(status='completed').count()

        # Statistics by type
        by_type = {}
        for choice in ResourceRequest.REQUEST_TYPE_CHOICES:
            type_code = choice[0]
            by_type[type_code] = base_queryset.filter(request_type=type_code).count()

        return Response({
            'success': True,
            'message': 'OK',
            'status': status.HTTP_200_OK,
            'data': {
                'total': total,
                'pending': pending,
                'approved': approved,
                'rejected': rejected,
                'completed': completed,
                'by_type': by_type
            }
        })

class DigitalResourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for digital resources (SRS 1.2)
    """
    queryset = DigitalResource.objects.all()
    serializer_class = DigitalResourceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset.prefetch_related('assignments')
        
        # Filter by specific branch if requested
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        # Filter by created_after for notifications
        created_after = self.request.query_params.get('created_after')
        if created_after:
            from django.utils.dateparse import parse_datetime
            parsed_date = parse_datetime(created_after)
            if parsed_date:
                queryset = queryset.filter(created_at__gt=parsed_date)
        
        # Admins see all resources
        if user.is_superuser:
            return queryset
        
        # Check if user is a student
        try:
            from students.models import Student
            student = Student.objects.select_related('grade', 'section').get(user=user)
            from django.db.models import Q
            
            # Student can see resources where:
            # 1. Specifically assigned to them
            # 2. Assigned to their class AND (their section OR no specific section)
            # 3. Target type 'all' or 'students' but ONLY if for their class/section
            
            student_filter = Q(
                # Specifically assigned to this student
                Q(assignments__student=student) |
                
                # Assigned to their class with matching section
                Q(assignments__class_fk=student.grade, assignments__section=student.section) |
                
                # Assigned to their class with no specific section (all sections)
                Q(assignments__class_fk=student.grade, assignments__section__isnull=True) |
                
                # Target type 'all' or 'students' for their specific class
                Q(
                    Q(assignments__target_type__in=['all', 'students']) &
                    Q(assignments__class_fk=student.grade) &
                    Q(Q(assignments__section=student.section) | Q(assignments__section__isnull=True))
                )
            )
            
            queryset = queryset.filter(student_filter).distinct()
            
            return queryset
        except Student.DoesNotExist:
            pass
        
        # Teachers see their own uploads + assigned resources
        try:
            from teachers.models import Teacher, TeacherAssignment
            teacher = Teacher.objects.get(user=user)
            # Get teacher's class/section assignments
            teacher_classes = TeacherAssignment.objects.filter(
                teacher=teacher, is_active=True
            ).values_list('class_fk_id', flat=True)
            teacher_sections = TeacherAssignment.objects.filter(
                teacher=teacher, is_active=True
            ).values_list('section_id', flat=True)
            
            from django.db.models import Q
            teacher_assignments = Q(
                Q(assignments__target_type='all') |
                Q(assignments__target_type='teachers') |
                Q(assignments__teacher=teacher) |
                Q(assignments__class_fk_id__in=teacher_classes) |
                Q(assignments__section_id__in=teacher_sections)
            )
            
            queryset = queryset.filter(
                Q(uploaded_by=user) | teacher_assignments
            ).distinct()
            return queryset
        except Teacher.DoesNotExist:
            pass
        
        # Other users - see public resources + their own uploads
        queryset = queryset.filter(is_public=True) | queryset.filter(uploaded_by=user)
            
        return queryset

    def create(self, request, *args, **kwargs):
        user = request.user
        # Get user's branch from UserBranchAccess (optional - not required)
        from users.models import UserBranchAccess
        user_branch = UserBranchAccess.objects.filter(user=user).first()
        branch = user_branch.branch if user_branch else None
        
        # Build data dict manually to avoid deep copy issues with file objects
        data = {
            'title': request.data.get('title'),
            'description': request.data.get('description', ''),
            'resource_type': request.data.get('resource_type'),
            'file': request.data.get('file'),
            'target_type': request.data.get('target_type', 'all'),
        }
        
        # Handle array fields from FormData
        target_students = request.data.getlist('target_students') if hasattr(request.data, 'getlist') else request.data.get('target_students', [])
        target_teachers = request.data.getlist('target_teachers') if hasattr(request.data, 'getlist') else request.data.get('target_teachers', [])
        target_classes = request.data.getlist('target_classes') if hasattr(request.data, 'getlist') else request.data.get('target_classes', [])
        
        # Ensure they're lists and filter out empty values
        data['target_students'] = [s for s in (target_students if isinstance(target_students, list) else [target_students]) if s]
        data['target_teachers'] = [t for t in (target_teachers if isinstance(target_teachers, list) else [target_teachers]) if t]
        data['target_classes'] = [c for c in (target_classes if isinstance(target_classes, list) else [target_classes]) if c]
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        resource = serializer.save(uploaded_by=user, branch=branch)
        
        return Response({
            'success': True,
            'message': 'Digital resource uploaded successfully',
            'status': 201,
            'data': self.get_serializer(resource).data
        }, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': status.HTTP_200_OK,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        """Delete a digital resource - only admin or the uploader can delete"""
        resource = self.get_object()
        user = request.user
        
        # Check if user is admin or the uploader
        user_roles = [r.role.name.lower() for r in user.userrole_set.all().select_related('role')]
        is_admin = user.is_superuser or user.is_staff or any(r in ['admin', 'super_admin', 'head_admin', 'ceo'] for r in user_roles)
        
        # Compare uploader - handle both ID and object comparisons
        is_uploader = False
        if resource.uploaded_by_id:
            is_uploader = str(resource.uploaded_by_id) == str(user.id)
        elif resource.uploaded_by:
            is_uploader = str(resource.uploaded_by.id) == str(user.id)
        
        # Debug logging
        print(f"DEBUG: Resource uploaded_by_id={resource.uploaded_by_id}, user.id={user.id}, is_uploader={is_uploader}, is_admin={is_admin}")
        
        if not (is_admin or is_uploader):
            return Response({
                'success': False,
                'message': f'Only administrators or the uploader can delete this resource. Resource uploader: {resource.uploaded_by_id}, Your ID: {user.id}',
                'status': 403
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Delete the file from storage
        if resource.file:
            resource.file.delete(save=False)
        
        # Delete the resource record
        resource.delete()
        
        return Response({
            'success': True,
            'message': 'Resource deleted successfully',
            'status': 200
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_classes_for_resource_assignment(request):
    """Get all classes for resource assignment dropdown (admin only)"""
    user = request.user
    user_roles = [r.role.name.lower() for r in user.userrole_set.all().select_related('role')]
    
    # Only admin/staff can access
    is_admin = user.is_superuser or user.is_staff or any(r in ['admin', 'super_admin', 'head_admin', 'ceo'] for r in user_roles)
    
    if not is_admin:
        return Response({
            'success': False,
            'message': 'Only administrators can access this endpoint',
            'status': 403
        }, status=status.HTTP_403_FORBIDDEN)
    
    from academics.models import Class
    classes = Class.objects.filter(is_active=True).values('id', 'grade').order_by('grade')
    
    return Response({
        'success': True,
        'message': 'OK',
        'status': 200,
        'data': list(classes)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_students_for_resource_assignment(request):
    """Get all students for resource assignment dropdown (admin only)"""
    user = request.user
    user_roles = [r.role.name.lower() for r in user.userrole_set.all().select_related('role')]
    
    # Only admin/staff can access
    is_admin = user.is_superuser or user.is_staff or any(r in ['admin', 'super_admin', 'head_admin', 'ceo'] for r in user_roles)
    
    if not is_admin:
        return Response({
            'success': False,
            'message': 'Only administrators can access this endpoint',
            'status': 403
        }, status=status.HTTP_403_FORBIDDEN)
    
    from students.models import Student
    students = Student.objects.select_related('user', 'grade').values(
        'id', 'user__full_name', 'grade__grade'
    ).order_by('user__full_name')
    
    data = [
        {
            'id': s['id'],
            'name': s['user__full_name'],
            'class': s['grade__grade']
        }
        for s in students
    ]
    
    return Response({
        'success': True,
        'message': 'OK',
        'status': 200,
        'data': data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teachers_for_resource_assignment(request):
    """Get all teachers for resource assignment dropdown (admin only)"""
    user = request.user
    user_roles = [r.role.name.lower() for r in user.userrole_set.all().select_related('role')]
    
    # Only admin/staff can access
    is_admin = user.is_superuser or user.is_staff or any(r in ['admin', 'super_admin', 'head_admin', 'ceo'] for r in user_roles)
    
    if not is_admin:
        return Response({
            'success': False,
            'message': 'Only administrators can access this endpoint',
            'status': 403
        }, status=status.HTTP_403_FORBIDDEN)
    
    from teachers.models import Teacher
    teachers = Teacher.objects.select_related('user').values(
        'id', 'user__full_name'
    ).order_by('user__full_name')
    
    data = [
        {
            'id': t['id'],
            'name': t['user__full_name']
        }
        for t in teachers
    ]
    
    return Response({
        'success': True,
        'message': 'OK',
        'status': 200,
        'data': data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teacher_assignments(request):
    """Get classes and subjects assigned to the current teacher"""
    user = request.user
    
    # Check if user is a teacher
    try:
        from teachers.models import Teacher, TeacherAssignment
        teacher = Teacher.objects.get(user=user)
    except Teacher.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Only teachers can access this endpoint',
            'status': 403
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get teacher's assignments
    assignments = TeacherAssignment.objects.filter(
        teacher=teacher,
        is_active=True
    ).select_related('class_fk', 'section', 'subject')
    
    # Group by class
    classes_data = {}
    for assignment in assignments:
        class_id = str(assignment.class_fk.id)
        if class_id not in classes_data:
            classes_data[class_id] = {
                'id': class_id,
                'grade': assignment.class_fk.grade,
                'sections': [],
                'subjects': []
            }
        
        # Add section if not already added
        if assignment.section:
            section_info = {'id': str(assignment.section.id), 'name': assignment.section.name}
            if section_info not in classes_data[class_id]['sections']:
                classes_data[class_id]['sections'].append(section_info)
        
        # Add subject if not already added
        subject_info = {'id': str(assignment.subject.id), 'name': assignment.subject.name}
        if subject_info not in classes_data[class_id]['subjects']:
            classes_data[class_id]['subjects'].append(subject_info)
    
    return Response({
        'success': True,
        'message': 'Teacher assignments retrieved successfully',
        'status': 200,
        'data': {
            'teacher_id': str(teacher.id),
            'teacher_name': user.full_name,
            'classes': list(classes_data.values())
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teacher_students(request):
    """Get students for a specific class/section/subject that the teacher teaches"""
    user = request.user
    class_id = request.query_params.get('class_id')
    section_id = request.query_params.get('section_id')
    subject_id = request.query_params.get('subject_id')
    
    if not class_id:
        return Response({
            'success': False,
            'message': 'class_id is required',
            'status': 400
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user is a teacher
    try:
        from teachers.models import Teacher, TeacherAssignment
        from students.models import Student
        teacher = Teacher.objects.get(user=user)
    except Teacher.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Only teachers can access this endpoint',
            'status': 403
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Verify teacher teaches this class/subject combination
    assignment_filter = {'teacher': teacher, 'class_fk_id': class_id, 'is_active': True}
    if section_id:
        assignment_filter['section_id'] = section_id
    if subject_id:
        assignment_filter['subject_id'] = subject_id
    
    has_assignment = TeacherAssignment.objects.filter(**assignment_filter).exists()
    
    if not has_assignment:
        return Response({
            'success': False,
            'message': 'You are not assigned to teach this class/section/subject',
            'status': 403
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get students
    student_filter = {'grade_id': class_id}
    if section_id:
        student_filter['section_id'] = section_id
    
    students = Student.objects.filter(**student_filter).select_related('user')
    
    data = [
        {
            'id': str(s.id),
            'name': s.user.full_name,
            'student_id': s.student_id
        }
        for s in students
    ]
    
    return Response({
        'success': True,
        'message': 'Students retrieved successfully',
        'status': 200,
        'data': data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_teacher_attendance(request):
    """Export attendance for teacher's assigned classes"""
    user = request.user
    user_roles = [r.role.name.lower() for r in user.userrole_set.all().select_related('role')]
    
    # Check if user is a teacher or admin
    is_teacher = 'teacher' in user_roles
    is_admin = user.is_superuser or user.is_staff or any(r in ['admin', 'super_admin', 'head_admin', 'ceo'] for r in user_roles)
    
    if not (is_teacher or is_admin):
        return Response({'success': False, 'message': 'Access denied', 'status': 403}, status=403)
    
    from teachers.models import Teacher, TeacherAssignment
    format_type = request.query_params.get('format', 'csv')
    class_id = request.query_params.get('class_id')
    section_id = request.query_params.get('section_id')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    # Get teacher's assigned class IDs
    try:
        teacher = Teacher.objects.get(user=user)
        teacher_assignments = TeacherAssignment.objects.filter(teacher=teacher, is_active=True)
        assigned_class_ids = list(teacher_assignments.values_list('class_fk_id', flat=True).distinct())
    except Teacher.DoesNotExist:
        if not is_admin:
            return Response({'success': False, 'message': 'Teacher profile not found'}, status=403)
        assigned_class_ids = []
    
    # Build attendance query
    attendance = Attendance.objects.all().select_related('student_id__user', 'student_id__grade', 'student_id__section')
    
    # Filter by teacher's classes (unless admin)
    if not is_admin and assigned_class_ids:
        attendance = attendance.filter(student_id__grade_id__in=assigned_class_ids)
    
    # Apply additional filters
    if class_id:
        # Verify teacher teaches this class
        if not is_admin and assigned_class_ids and int(class_id) not in assigned_class_ids:
            return Response({'success': False, 'message': 'You are not assigned to this class'}, status=403)
        attendance = attendance.filter(student_id__grade_id=class_id)
    
    if section_id:
        attendance = attendance.filter(student_id__section_id=section_id)
    if start_date:
        attendance = attendance.filter(date__gte=start_date)
    if end_date:
        attendance = attendance.filter(date__lte=end_date)
    
    if not attendance.exists():
        return Response({'success': False, 'message': 'No attendance records found for the selected criteria'}, status=200)
    
    headers = ['Student ID', 'Student Name', 'Class', 'Section', 'Date', 'Status']
    data = [
        [
            a.student_id.student_id or str(a.student_id.id)[:8].upper(),
            a.student_id.user.full_name,
            a.student_id.grade.grade if a.student_id.grade else 'N/A',
            a.student_id.section.name if a.student_id.section else 'N/A',
            a.date.strftime('%Y-%m-%d'),
            a.status
        ]
        for a in attendance
    ]
    
    if format_type == 'pdf':
        buffer = PDFExporter.export_list_to_pdf('Attendance Report', headers, data)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="attendance_{timezone.now().strftime("%Y%m%d")}.pdf"'
        return response
    elif format_type == 'excel':
        buffer = ExcelExporter.export_to_excel('Attendance Report', headers, data, 'Attendance')
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="attendance_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        return response
    else:  # CSV
        csv_data = CSVExporter.export_to_csv(headers, data)
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="attendance_{timezone.now().strftime("%Y%m%d")}.csv"'
        return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_teacher_grades(request):
    """Export grades for teacher's assigned classes/subjects"""
    user = request.user
    user_roles = [r.role.name.lower() for r in user.userrole_set.all().select_related('role')]
    
    # Check if user is a teacher or admin
    is_teacher = 'teacher' in user_roles
    is_admin = user.is_superuser or user.is_staff or any(r in ['admin', 'super_admin', 'head_admin', 'ceo'] for r in user_roles)
    
    if not (is_teacher or is_admin):
        return Response({'success': False, 'message': 'Access denied', 'status': 403}, status=403)
    
    from teachers.models import Teacher, TeacherAssignment
    from lessontopics.models import ExamResults
    
    format_type = request.query_params.get('format', 'csv')
    class_id = request.query_params.get('class_id')
    section_id = request.query_params.get('section_id')
    subject_id = request.query_params.get('subject_id')
    term_id = request.query_params.get('term_id')
    
    # Get teacher's assignments
    try:
        teacher = Teacher.objects.get(user=user)
        teacher_assignments = TeacherAssignment.objects.filter(teacher=teacher, is_active=True)
        assigned_class_ids = list(teacher_assignments.values_list('class_fk_id', flat=True).distinct())
        assigned_subject_ids = list(teacher_assignments.values_list('subject_id', flat=True).distinct())
    except Teacher.DoesNotExist:
        if not is_admin:
            return Response({'success': False, 'message': 'Teacher profile not found'}, status=403)
        assigned_class_ids = []
        assigned_subject_ids = []
    
    # Build grades query
    results = ExamResults.objects.all().select_related(
        'student_id__user', 'student_id__grade', 'student_id__section',
        'subject_id', 'exam_id'
    )
    
    # Filter by teacher's classes/subjects (unless admin)
    if not is_admin:
        if assigned_class_ids:
            results = results.filter(student_id__grade_id__in=assigned_class_ids)
        if assigned_subject_ids:
            results = results.filter(
                models.Q(subject_id__in=assigned_subject_ids) | 
                models.Q(teacher_assignment__subject_id__in=assigned_subject_ids)
            )
    
    # Apply additional filters
    if class_id:
        if not is_admin and assigned_class_ids and int(class_id) not in assigned_class_ids:
            return Response({'success': False, 'message': 'You are not assigned to this class'}, status=403)
        results = results.filter(student_id__grade_id=class_id)
    
    if section_id:
        results = results.filter(student_id__section_id=section_id)
    if subject_id:
        if not is_admin and assigned_subject_ids and int(subject_id) not in assigned_subject_ids:
            return Response({'success': False, 'message': 'You are not assigned to this subject'}, status=403)
        results = results.filter(
            models.Q(subject_id=subject_id) | models.Q(teacher_assignment__subject_id=subject_id)
        )
    if term_id:
        results = results.filter(exam_id__term_id=term_id)
    
    if not results.exists():
        return Response({'success': False, 'message': 'No grades found matching the criteria'}, status=200)
    
    headers = ['Student ID', 'Student Name', 'Class', 'Section', 'Subject', 'Exam', 'Score', 'Grade', 'Date']
    data = [
        [
            r.student_id.student_id or str(r.student_id.id)[:8].upper(),
            r.student_id.user.full_name,
            r.student_id.grade.grade if r.student_id.grade else 'N/A',
            r.student_id.section.name if r.student_id.section else 'N/A',
            r.subject_id.name if r.subject_id else (r.teacher_assignment.subject.name if r.teacher_assignment else 'N/A'),
            r.exam_id.name if r.exam_id else 'N/A',
            str(r.score) if hasattr(r, 'score') else 'N/A',
            r.grade if hasattr(r, 'grade') else 'N/A',
            r.exam_id.date.strftime('%Y-%m-%d') if r.exam_id and hasattr(r.exam_id, 'date') else 'N/A'
        ]
        for r in results
    ]
    
    if format_type == 'pdf':
        buffer = PDFExporter.export_list_to_pdf('Grades Report', headers, data)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="grades_{timezone.now().strftime("%Y%m%d")}.pdf"'
        return response
    elif format_type == 'excel':
        buffer = ExcelExporter.export_to_excel('Grades Report', headers, data, 'Grades')
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="grades_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        return response
    else:  # CSV
        csv_data = CSVExporter.export_to_csv(headers, data)
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="grades_{timezone.now().strftime("%Y%m%d")}.csv"'
        return response
