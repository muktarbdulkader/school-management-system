from django.shortcuts import render
from django.db import models
from django.db.models import Q, Avg, Max, Count
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from openai import chat
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from users.models import User, has_model_permission
from .models import Chat, GroupChat, GroupChatMember, GroupChatMessage, Meeting, Announcement, ParentFeedback, Notification
from students.models import StudentSubject
from .serializers import ChatSerializer, ConversationSummarySerializer, GroupChatConversationSummarySerializer, GroupChatMessageDetailSerializer, GroupChatMessageSerializer, MeetingSerializer, AnnouncementSerializer, GroupChatSerializer, GroupChatMemberSerializer, MessageDetailSerializer, ParentFeedbackSerializer, NotificationSerializer

class ChatViewSet(viewsets.ModelViewSet):
    queryset = Chat.objects.all()
    serializer_class = ChatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'chat', 'view_chat', branch_id):
            raise PermissionDenied("You do not have permission to view chats in this branch.")
        # Superusers and staff can see all chats; regular users only see their own
        if user.is_superuser or user.is_staff:
            if branch_id:
                return self.queryset.filter(
                    models.Q(sender__userbranchaccess__branch_id=branch_id) |
                    models.Q(receiver__userbranchaccess__branch_id=branch_id)
                ).distinct().order_by('-timestamp')
            return self.queryset.all().order_by('-timestamp')
        return self.queryset.filter(
            models.Q(sender=user) | models.Q(receiver=user)
        ).order_by('-timestamp')

    @action(detail=False, methods=['get'], url_path='conversations')
    def conversations(self, request, *args, **kwargs):
        from .models import Chat  # Import here to avoid circular imports
        from students.models import Student, ParentStudent
        from users.models import User
        from teachers.models import Teacher
        
        # Check if student_id is provided (for parent viewing child's messages)
        student_id = request.query_params.get('student_id')
        effective_user = request.user
        student = None
        
        if student_id and student_id != 'undefined' and student_id != 'null':
            try:
                # First try to find by Student.id
                student = Student.objects.get(id=student_id)
            except Student.DoesNotExist:
                # If that fails, try to find by Student.user_id
                try:
                    student = Student.objects.get(user_id=student_id)
                except Student.DoesNotExist:
                    pass
            
            if student:
                # Check if user is parent of this student or is the student themselves
                is_parent = ParentStudent.objects.filter(parent__user=request.user, student=student).exists()
                is_own_profile = student.user == request.user
                is_teacher = Teacher.objects.filter(user=request.user).exists()
                
                if is_parent or is_own_profile or is_teacher or request.user.is_staff:
                    effective_user = student.user
                else:
                    raise PermissionDenied("You do not have permission to view this student's conversations.")
        
        # If no student_id provided, check if the logged-in user IS a student
        if not student:
            try:
                student = Student.objects.get(user=request.user)
                effective_user = student.user
                print(f"DEBUG: Found student {student.id} from user {request.user.id}")
            except Student.DoesNotExist:
                print(f"DEBUG: User {request.user.id} is not a student")
                pass  # User is not a student, use request.user as-is
        
        # Get chats where effective_user is sender or receiver
        queryset = Chat.objects.filter(
            models.Q(sender=effective_user) | models.Q(receiver=effective_user)
        ).order_by('-timestamp')
        print(f"DEBUG: effective_user={effective_user.id}, queryset count={queryset.count()}")
        
        # Debug: Show all chats found
        for chat in queryset[:5]:
            print(f"DEBUG CHAT: id={chat.id}, sender={chat.sender.id} ({chat.sender.full_name}), receiver={chat.receiver.id} ({chat.receiver.full_name}), msg={chat.message[:30]}...")
        
        # Group by other user and get the latest chat
        conversations = {}
        for chat in queryset:
            other_user = chat.receiver if chat.sender == effective_user else chat.sender
            other_user_id = other_user.id
            existing_conversation = conversations.get(other_user_id)
            if not existing_conversation or chat.timestamp > existing_conversation['chat_instance'].timestamp:
                conversations[other_user_id] = {
                    'other_user': other_user,
                    'latest_message': chat.message,
                    'last_timestamp': chat.timestamp,
                    'chat_instance': chat  # Keep the original chat for unread count
                }
        summarized_chats = conversations.values()
        print(f"DEBUG: Total conversations found: {len(conversations)}")
        for conv in summarized_chats:
            print(f"DEBUG CONV: other_user={conv['other_user'].full_name}, msg={conv['latest_message'][:30]}...")

        serializer = ConversationSummarySerializer(summarized_chats, many=True, context={'request': request})
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        
        # Include student context if viewing as parent/teacher
        if student and effective_user != request.user:
            response_data['student_context'] = {
                'student_id': str(student.id),
                'student_name': student.user.full_name,
                'viewing_as': 'parent'
            }
        
        return Response(response_data)

    @action(detail=False, methods=['get'], url_path='conversation/(?P<with_user_id>[^/.]+)')
    def conversation(self, request, with_user_id=None):
        from .models import Chat
        user = request.user
        branch_id = request.query_params.get('branch_id')
        
        print(f"DEBUG CONV API: user={user.id} ({user.full_name}), with_user_id={with_user_id}")

        if branch_id and not has_model_permission(user, 'chat', 'view_chat', branch_id):
            raise PermissionDenied("You do not have permission to view chats in this branch.")

        try:
            other_user = User.objects.get(id=with_user_id)
            print(f"DEBUG CONV API: other_user={other_user.id} ({other_user.full_name})")
        except User.DoesNotExist:
            print(f"DEBUG CONV API: User {with_user_id} not found")
            return Response({
                'success': False,
                'message': 'User not found',
                'status': 404,
                'data': []
            }, status=status.HTTP_404_NOT_FOUND)

        # Fetch all messages where the current user is either sender or receiver, and the other user is the counterpart
        queryset = Chat.objects.filter(
            (Q(sender=user) & Q(receiver=other_user)) | 
            (Q(sender=other_user) & Q(receiver=user))
        ).order_by('-timestamp')
        
        print(f"DEBUG CONV API: Found {queryset.count()} messages")
        for msg in queryset[:3]:
            print(f"DEBUG CONV MSG: id={msg.id}, sender={msg.sender.full_name}, receiver={msg.receiver.full_name}, msg={msg.message[:30]}")

        serializer = MessageDetailSerializer(queryset, many=True, context={'request': request})
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        # Use the serializer directly without summarization to show all chats
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        receiver_id = self.request.data.get('receiver')
        if not receiver_id:
            raise PermissionDenied("Receiver ID is required.")
        if branch_id and not has_model_permission(self.request.user, 'chat', 'add_chat', branch_id):
            raise PermissionDenied("You do not have permission to create chats in this branch.")

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise PermissionDenied("Receiver does not exist.")

        serializer.save(sender=self.request.user)

    def create(self, request, *args, **kwargs):
        receiver_id = request.data.get('receiver')
        
        # Handle bulk messaging to a subject group
        if isinstance(receiver_id, str) and receiver_id.startswith('subject_group_'):
            subject_id = receiver_id.replace('subject_group_', '')
            sender = request.user
            message_text = request.data.get('message', '')
            attachment = request.data.get('attachment')
            branch_id = request.data.get('branch_id')

            if branch_id and not has_model_permission(sender, 'chat', 'add_chat', branch_id):
                raise PermissionDenied("You do not have permission to create chats in this branch.")

            # Identify students in this subject
            from teachers.models import Teacher, TeacherAssignment
            from students.models import Student
            from django.db.models import Q
            
            teacher_profile = Teacher.objects.filter(user=sender).first()
            if not teacher_profile:
                raise PermissionDenied("Only teachers can send bulk messages to subject groups.")
            
            assignment_records = TeacherAssignment.objects.filter(teacher=teacher_profile, subject=subject_id)
            student_query = Q()
            for assignment in assignment_records:
                if assignment.section:
                    student_query |= Q(section=assignment.section)
                elif assignment.class_fk:
                    student_query |= Q(grade=assignment.class_fk)
            
            if not student_query:
                 return Response({
                    'success': False,
                    'message': 'No students found in this subject group.',
                    'status': 400,
                    'data': None
                 }, status=400)
                 
            students = Student.objects.filter(student_query)
            enrolled_check = StudentSubject.objects.filter(subject_id=subject_id)
            if enrolled_check.exists():
                 students = students.filter(id__in=enrolled_check.values_list('student_id', flat=True))
                 
            # Create a chat for each student
            chats = []
            for s in students:
                chat = Chat(
                    sender=sender,
                    receiver=s.user,
                    message=message_text,
                    attachment=attachment,
                )
                chats.append(chat)
                
            Chat.objects.bulk_create(chats)
            
            return Response({
                'success': True,
                'message': f'Message sent to {len(chats)} students successfully.',
                'status': 201,
                'data': {'count': len(chats)}
            }, status=201)

        # Standard single-user message flow
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }
        return Response(response_data, status=201)

    def perform_update(self, serializer):
        if not has_model_permission(self.request.user, 'chat', 'change_chat', branch_id=None):
            raise PermissionDenied("You do not have permission to update chats.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_destroy(self, instance):
        if not has_model_permission(self.request.user, 'chat', 'delete_chat', branch_id=None):
            raise PermissionDenied("You do not have permission to delete chats.")
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }
        return Response(response_data, status=204)

    @action(detail=False, methods=['get'], url_path='teacher_students_contacts')
    def teacher_students_contacts(self, request):
        """
        Retrieves a list of students and teachers relevant to the current user.
        Used for composing new messages across different dashboards (Teacher, Student, Admin).
        NOTE: Parents have been removed from this logic per latest requirements.
        """
        user = request.user
        branch_id = request.query_params.get('branch_id')
        subject_id = request.query_params.get('subject_id')
        class_id = request.query_params.get('class_id')
        
        from teachers.models import Teacher, TeacherAssignment
        from students.models import Student, ParentStudent, StudentSubject
        from academics.models import Subject, Class, Section
        from users.models import UserBranchAccess
        from django.db.models import Q
        from django.core.exceptions import ValidationError
        
        # Detect Roles
        is_admin_staff = user.is_staff or user.is_superuser
        teacher_profile = Teacher.objects.filter(user=user).first()
        student_profile = Student.objects.filter(user=user).first()
        
        student_contacts = []
        teacher_contacts = []
        available_subjects = []
        available_classes = []
        
        # 1. ADMIN / STAFF LOGIC
        if is_admin_staff:
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            if not accessible_branches and user.is_superuser:
                 # Superusers see everything
                 all_teachers = Teacher.objects.all().select_related('user', 'branch')
                 all_students = Student.objects.all().select_related('user', 'grade', 'section')
            else:
                 all_teachers = Teacher.objects.filter(
                     Q(branch__in=accessible_branches) | Q(user__userbranchaccess__branch_id__in=accessible_branches)
                 ).distinct().select_related('user', 'branch')
                 all_students = Student.objects.filter(branch_id__in=accessible_branches).distinct().select_related('user', 'grade', 'section')
            
            # Apply Subject Filter for Admin if provided
            if subject_id:
                enrolled_student_ids = StudentSubject.objects.filter(subject_id=subject_id).values_list('student_id', flat=True)
                all_students = all_students.filter(id__in=enrolled_student_ids)
            
            # Apply Class Filter for Admin if provided
            if class_id:
                try:
                    all_students = all_students.filter(grade_id=class_id)
                except (ValidationError, ValueError):
                    pass

            # Format Teachers
            for t in all_teachers:
                teacher_contacts.append({
                    'user_id': str(t.user.id),
                    'teacher_id': str(t.id),
                    'full_name': t.user.full_name,
                    'email': t.user.email,
                    'branch_name': t.branch.name if t.branch else 'Global',
                    'subjects': list(TeacherAssignment.objects.filter(teacher=t).values_list('subject__name', flat=True).distinct())
                })
            
            # Format Students
            for s in all_students:
                student_contacts.append({
                    'user_id': str(s.user.id),
                    'student_id': str(s.id),
                    'full_name': s.user.full_name,
                    'student_code': s.student_id,
                    'email': s.user.email,
                    'class': s.grade.grade if s.grade else 'N/A',
                    'section': s.section.name if s.section else 'All'
                })
            
            # Filters for Admin
            available_subjects = Subject.objects.all().values('id', 'name').distinct()
            available_classes = Class.objects.all().values('id', 'grade').distinct()

        # 2. TEACHER LOGIC
        elif teacher_profile:
            # First, find what this teacher teaches
            assignment_records = TeacherAssignment.objects.filter(teacher=teacher_profile)
            
            # If a subject is selected, narrow down to only those students
            if subject_id:
                assignment_records = assignment_records.filter(subject=subject_id)
            
            # If a class is selected, narrow down to only those students
            valid_class_id = None
            if class_id:
                try:
                    from academics.models import Class
                    selected_class = Class.objects.get(id=class_id)
                    assignment_records = assignment_records.filter(class_fk=selected_class)
                    valid_class_id = class_id
                except (Class.DoesNotExist, ValidationError):
                    pass

            # Build query to find relevant students
            student_query = Q()
            for assignment in assignment_records:
                if assignment.section:
                    student_query |= Q(section=assignment.section)
                elif assignment.class_fk:
                    student_query |= Q(grade=assignment.class_fk)
            
            # If class_id is directly provided, also filter by that class
            if valid_class_id:
                student_query &= Q(grade_id=valid_class_id)
            
            if student_query:
                students = Student.objects.filter(student_query).distinct().select_related('user', 'grade', 'section')
                if branch_id:
                    students = students.filter(branch_id=branch_id)
                
                # OPTIONAL: Apply StudentSubject check ONLY if enrollment data exists for this subject
                if subject_id:
                    enrolled_check = StudentSubject.objects.filter(subject_id=subject_id)
                    if enrolled_check.exists():
                         students = students.filter(id__in=enrolled_check.values_list('student_id', flat=True))

                # User requested a way to talk to ALL students in a subject
                if subject_id and students.exists():
                    subject_obj = Subject.objects.filter(id=subject_id).first()
                    subject_name = subject_obj.name if subject_obj else "Subject"
                    student_contacts.append({
                        'id': f"subject_group_{subject_id}",
                        'user_id': f"subject_group_{subject_id}",
                        'is_group': True,
                        'student_details': {
                            'id': 'all',
                            'user_details': {
                                'full_name': f"All Students - {subject_name}",
                                'email': ''
                            },
                            'section_details': {
                                'name': 'All',
                                'class_details': { 'grade': 'Group' }
                            }
                        }
                    })

                for s in students:
                    student_contacts.append({
                        'id': str(s.user.id),
                        'user_id': str(s.user.id),
                        'student_details': {
                            'id': str(s.id),
                            'user_details': {
                                'full_name': s.user.full_name,
                                'email': s.user.email
                            },
                            'section_details': {
                                'name': s.section.name if s.section else 'All',
                                'class_details': { 'grade': s.grade.grade if s.grade else 'N/A' }
                            }
                        }
                    })
            
            # Peer Teachers (Same branch)
            from users.models import UserBranchAccess
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            peers = Teacher.objects.filter(
                Q(branch__in=accessible_branches) | Q(user__userbranchaccess__branch_id__in=accessible_branches)
            ).exclude(user=user).distinct().select_related('user', 'branch')
            
            for p in peers:
                teacher_contacts.append({
                    'user_id': str(p.user.id),
                    'teacher_id': str(p.id),
                    'full_name': p.user.full_name,
                    'email': p.user.email,
                    'branch_name': p.branch.name if p.branch else 'Global'
                })

            # Get available subjects and classes from teacher's assignments
            available_subjects = Subject.objects.filter(
                id__in=assignment_records.values_list('subject_id', flat=True)
            ).values('id', 'name').distinct()
            available_classes = Class.objects.filter(
                id__in=assignment_records.values_list('class_fk_id', flat=True)
            ).values('id', 'grade').distinct()

        # 3. STUDENT LOGIC
        elif student_profile:
            # Students can find peers in the same subject to talk about it
            if subject_id:
                peer_ids = StudentSubject.objects.filter(subject_id=subject_id).exclude(student_id=student_profile).values_list('student_id', flat=True)
                peers = Student.objects.filter(id__in=peer_ids, branch_id=student_profile.branch_id).select_related('user', 'grade', 'section')
                
                for s in peers:
                    student_contacts.append({
                        'user_id': str(s.user.id),
                        'student_id': str(s.id),
                        'full_name': s.user.full_name,
                        'student_code': s.student_id,
                        'email': s.user.email,
                        'class': s.grade.grade if s.grade else 'N/A',
                        'section': s.section.name if s.section else 'All'
                    })
            
            # Students can also message their own teachers
            teacher_ids = TeacherAssignment.objects.filter(
                Q(class_fk=student_profile.grade) | Q(section=student_profile.section)
            ).values_list('teacher', flat=True).distinct()
            
            if subject_id:
                teacher_ids = teacher_ids.filter(subject=subject_id)

            teachers = Teacher.objects.filter(id__in=teacher_ids).select_related('user')
            for t in teachers:
                teacher_contacts.append({
                    'user_id': str(t.user.id),
                    'teacher_id': str(t.id),
                    'full_name': t.user.full_name,
                    'email': t.user.email
                })

            # Available subjects for student
            available_subjects = Subject.objects.filter(studentsubject__student_id=student_profile).values('id', 'name').distinct()

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'students': student_contacts,
                'teachers': teacher_contacts,
                'subjects': available_subjects,
                'classes': available_classes
            }
        })

class ChatHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Chat.objects.all().order_by("-timestamp")
    serializer_class = ChatSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sender', 'receiver']
    search_fields = ['message', 'sender__username', 'receiver__username']
    ordering_fields = ['timestamp']

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not (user.is_superuser or user.is_staff) and not has_model_permission(user, 'chat', 'view_chat', branch_id):
            raise PermissionDenied("You do not have permission to view chat history in this branch.")
        # Superusers and staff can see all chats; regular users only see their own
        if user.is_superuser or user.is_staff:
            if branch_id:
                return self.queryset.filter(
                    models.Q(sender__userbranchaccess__branch_id=branch_id) |
                    models.Q(receiver__userbranchaccess__branch_id=branch_id)
                ).distinct().order_by("-timestamp")
            return self.queryset.all().order_by("-timestamp")
        return self.queryset.filter(
            models.Q(sender=user) | models.Q(receiver=user)
        ).order_by("-timestamp")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        if user.is_superuser or user.is_staff:
            if branch_id:
                return self.queryset.filter(requested_by__userbranchaccess__branch_id=branch_id)
            return self.queryset.all()

        if branch_id and not has_model_permission(user, 'meeting', 'view_meeting', branch_id):
            raise PermissionDenied("You do not have permission to view meetings in this branch.")

        # Exclude canceled meetings by default for regular users
        return self.queryset.filter(
            models.Q(requested_by=user) | models.Q(requested_to=user),
            is_canceled=False
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_create(self, serializer):
        user = self.request.user
        branch_id = self.request.data.get('branch_id')
        
        # Super admins bypass permission check
        if not user.is_superuser:
            if not has_model_permission(user, 'meeting', 'add_meeting', branch_id):
                raise PermissionDenied("You do not have permission to create meetings.")
        
        # Auto-set requested_by to current user
        serializer.save(requested_by=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }
        return Response(response_data, status=201)

    def perform_update(self, serializer):
        if not has_model_permission(self.request.user, 'meeting', 'change_meeting', branch_id=None):
            raise PermissionDenied("You do not have permission to update meetings.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_destroy(self, instance):
        if not has_model_permission(self.request.user, 'meeting', 'delete_meeting', branch_id=None):
            raise PermissionDenied("You do not have permission to delete meetings.")
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }
        return Response(response_data, status=204)

    @action(detail=True, methods=['patch'], url_path='reschedule')
    def reschedule(self, request, pk=None):
        meeting = self.get_object()
        if not has_model_permission(self.request.user, 'meeting', 'change_meeting', branch_id=None):
            raise PermissionDenied("You do not have permission to reschedule meetings.")

        if meeting.is_canceled:
            return Response({
                'success': False,
                'message': 'Cannot reschedule a canceled meeting',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(
            meeting,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)

        # Only allow updating date, time, and notes
        allowed_fields = {'requested_date', 'requested_time', 'notes'}
        if not set(request.data.keys()).issubset(allowed_fields):
            return Response({
                'success': False,
                'message': 'Only requested_date, requested_time, and notes can be updated',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({
            'success': True,
            'message': 'Meeting rescheduled successfully',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=True, methods=['patch'], url_path='approve')
    def approve(self, request, pk=None):
        meeting = self.get_object()
        if not has_model_permission(self.request.user, 'meeting', 'change_meeting', branch_id=None):
            raise PermissionDenied("You do not have permission to approve meetings.")

        if request.user == meeting.requested_by and not request.user.is_superuser:
            raise PermissionDenied("You cannot approve your own meeting request.")

        if meeting.status != 'pending':
            return Response({
                'success': False,
                'message': 'Only pending meetings can be approved',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        meeting.status = 'approved'
        meeting.save()

        serializer = self.get_serializer(meeting)
        return Response({
            'success': True,
            'message': 'Meeting approved successfully',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=True, methods=['patch'], url_path='reject')
    def reject(self, request, pk=None):
        meeting = self.get_object()
        if not has_model_permission(self.request.user, 'meeting', 'change_meeting', branch_id=None):
            raise PermissionDenied("You do not have permission to reject meetings.")

        if request.user == meeting.requested_by and not request.user.is_superuser:
            raise PermissionDenied("You cannot reject your own meeting request.")

        if meeting.status != 'pending':
            return Response({
                'success': False,
                'message': 'Only pending meetings can be rejected',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        meeting.status = 'rejected'
        meeting.save()

        serializer = self.get_serializer(meeting)
        return Response({
            'success': True,
            'message': 'Meeting rejected successfully',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=True, methods=['patch'], url_path='mark_completed')
    def mark_completed(self, request, pk=None):
        meeting = self.get_object()
        if not has_model_permission(self.request.user, 'meeting', 'change_meeting', branch_id=None):
            raise PermissionDenied("You do not have permission to update meetings.")

        if request.user == meeting.requested_by and not request.user.is_superuser:
            raise PermissionDenied("You cannot mark your own meeting request as completed.")

        if meeting.status not in ['approved', 'confirmed']:
            return Response({
                'success': False,
                'message': 'Only approved or confirmed meetings can be marked as completed',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        meeting.status = 'completed'
        meeting.save()

        serializer = self.get_serializer(meeting)
        return Response({
            'success': True,
            'message': 'Meeting marked as completed',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        meeting = self.get_object()
        if not has_model_permission(self.request.user, 'meeting', 'change_meeting', branch_id=None):
            raise PermissionDenied("You do not have permission to cancel meetings.")

        if meeting.is_canceled:
            return Response({
                'success': False,
                'message': 'Meeting is already canceled',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        if meeting.status != 'pending':
            return Response({
                'success': False,
                'message': 'Only pending meetings can be canceled',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        meeting.is_canceled = True
        meeting.canceled_at = timezone.now()
        meeting.save()

        serializer = self.get_serializer(meeting)
        return Response({
            'success': True,
            'message': 'Meeting canceled successfully',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='archived')
    def archived(self, request):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'meeting', 'view_meeting', branch_id):
            raise PermissionDenied("You do not have permission to view archived meetings in this branch.")

        queryset = Meeting.objects.filter(
            models.Q(requested_by=user) | models.Q(requested_to=user),
            is_canceled=True
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='add_feedback')
    def add_feedback(self, request, pk=None):
        meeting = self.get_object()
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'meeting', 'change_meeting', branch_id):
            raise PermissionDenied("You do not have permission to add feedback.")

        if not meeting.can_add_feedback():
            return Response({
                'success': False,
                'message': 'Feedback can only be added after the approved meeting date.',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        if self.request.user != meeting.requested_by:
            return Response({
                'success': False,
                'message': 'Only the requesting parent can add feedback.',
                'status': 403,
                'data': []
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(
            meeting,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)

        if 'parent_comment' in request.data or 'parent_rating' in request.data:
            if 'parent_rating' in request.data and not 1 <= request.data['parent_rating'] <= 5:
                return Response({
                    'success': False,
                    'message': 'Rating must be between 1 and 5.',
                    'status': 400,
                    'data': []
                }, status=status.HTTP_400_BAD_REQUEST)
            serializer.save()

        meeting.refresh_from_db()
        serializer = self.get_serializer(meeting)
        return Response({
            'success': True,
            'message': 'Feedback added successfully',
            'status': 200,
            'data': serializer.data
        })
    @action(detail=False, methods=['get'], url_path='feedbacks')
    def list_feedback(self, request):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'meeting', 'view_meeting', branch_id):
            raise PermissionDenied("You do not have permission to view meeting feedback in this branch.")

        # Filter meetings where the user is involved (requested_by or requested_to) and has feedback
        queryset = self.queryset.filter(
            models.Q(requested_by=user) | models.Q(requested_to=user),
            models.Q(parent_comment__isnull=False) | models.Q(parent_rating__isnull=False)  # Match either field
        ).exclude(is_canceled=True)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })
    @action(detail=True, methods=['get'], url_path='feedback')
    def get_feedback(self, request, pk=None):
        meeting = self.get_object()
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'meeting', 'view_meeting', branch_id):
            raise PermissionDenied("You do not have permission to view meeting feedback in this branch.")

        if meeting.is_canceled:
            return Response({
                'success': False,
                'message': 'No feedback available for canceled meetings.',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(meeting)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['audience_roles', 'urgency']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'urgency']

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        urgency = self.request.query_params.get('urgency')
        if branch_id and not has_model_permission(user, 'announcement', 'view_announcement', branch_id):
            raise PermissionDenied("You do not have permission to view announcements in this branch.")

        user_roles = user.userrole_set.values_list('role__id', flat=True)
        queryset = self.queryset.filter(
            models.Q(audience_roles__id__in=user_roles) |
            models.Q(audience_roles__isnull=True)
        ).distinct()
        if branch_id:
            queryset = queryset.filter(created_by__userbranchaccess__branch_id=branch_id)
        elif not user.is_superuser:
            # If no branch_id, only show announcements from branches they have access to
            # This is critical for data privacy!
            from users.models import UserBranchAccess
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            if accessible_branches.exists():
                queryset = queryset.filter(created_by__userbranchaccess__branch_id__in=accessible_branches)

        if urgency:
            queryset = queryset.filter(urgency=urgency)

        from django.db.models import Case, When, Value, IntegerField
        return queryset.annotate(
            urgency_priority=Case(
                When(urgency='HIGH', then=Value(1)),
                When(urgency='MEDIUM', then=Value(2)),
                When(urgency='LOW', then=Value(3)),
                default=Value(4),
                output_field=IntegerField(),
            )
        ).order_by('urgency_priority', '-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'announcement', 'add_announcement', branch_id):
            raise PermissionDenied("You do not have permission to create announcements in this branch.")
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }
        return Response(response_data, status=201)

    def perform_update(self, serializer):
        if not has_model_permission(self.request.user, 'announcement', 'change_announcement', branch_id=None):
            raise PermissionDenied("You do not have permission to update announcements.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_destroy(self, instance):
        if not has_model_permission(self.request.user, 'announcement', 'delete_announcement', branch_id=None):
            raise PermissionDenied("You do not have permission to delete announcements.")
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }
        return Response(response_data, status=204)

    @action(detail=False, methods=['get'], url_path='urgent')
    def urgent_announcements(self, request):
        """
        Get all urgent (HIGH urgency) announcements for the current user
        """
        user = request.user
        branch_id = request.query_params.get('branch_id')

        # Skip branch permission check for students and parents for urgent announcements
        try:
            from students.models import Student, ParentStudent
            is_student_or_parent = Student.objects.filter(user=user).exists() or \
                                ParentStudent.objects.filter(parent__user=user).exists()

            if not is_student_or_parent:
                if branch_id and not has_model_permission(user, 'announcement', 'view_announcement', branch_id):
                    raise PermissionDenied("You do not have permission to view announcements in this branch.")
        except:
            if branch_id and not has_model_permission(user, 'announcement', 'view_announcement', branch_id):
                raise PermissionDenied("You do not have permission to view announcements in this branch.")

        # For urgent announcements, be more permissive - show to all authenticated users
        # unless they have specific audience role restrictions
        try:
            user_roles = user.userrole_set.values_list('role__id', flat=True)
            queryset = self.queryset.filter(
                models.Q(audience_roles__id__in=user_roles) |
                models.Q(audience_roles__isnull=True),
                urgency__iexact='HIGH'
            ).distinct()
        except:
            # If user roles check fails, show all urgent announcements
            queryset = self.queryset.filter(urgency__iexact='HIGH')

        if branch_id:
            queryset = queryset.filter(created_by__userbranchaccess__branch_id=branch_id)

        queryset = queryset.order_by('-created_at')
        serializer = self.get_serializer(queryset, many=True)

        return Response({
            'success': True,
            'message': 'Urgent announcements retrieved successfully',
            'status': 200,
            'data': serializer.data
        })

class GroupChatViewSet(viewsets.ModelViewSet):
    queryset = GroupChat.objects.all()
    serializer_class = GroupChatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'groupchat', 'view_groupchat', branch_id):
            raise PermissionDenied("You do not have permission to view group chats in this branch.")
        # Show groups where user is a member (not just creator)
        queryset = self.queryset.filter(members__user=user).distinct()
        print(f"DEBUG GroupChatViewSet: user={user.email}, id={user.id}, queryset count={queryset.count()}")
        # Check if user has any memberships
        from .models import GroupChatMember
        memberships = GroupChatMember.objects.filter(user=user)
        print(f"DEBUG GroupChatViewSet: memberships count={memberships.count()}")
        for m in memberships:
            print(f"DEBUG GroupChatViewSet: membership - group={m.group_chat.name}, user={m.user.email}")
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'groupchat', 'add_groupchat', branch_id):
            raise PermissionDenied("You do not have permission to create group chats in this branch.")
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        from users.models import UserRole
        from django.db.models import Q
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Add creator as a member of the group
        group = serializer.instance
        GroupChatMember.objects.get_or_create(group_chat=group, user=request.user)
        
        # Add members based on target audience
        target = request.data.get('target', 'all')
        if target and target != 'all':
            # Get users with specific role
            role_map = {
                'teachers': 'teacher',
                'students': 'student',
                'admins': 'admin',
                'parents': 'parent',
            }
            role_name = role_map.get(target, target)
            
            # Find users with this role
            users_with_role = User.objects.filter(
                userrole__role__name__iexact=role_name
            ).distinct()
            
            # Add them as members (exclude creator who is already added)
            for user in users_with_role:
                if user.id != request.user.id:
                    GroupChatMember.objects.get_or_create(group_chat=group, user=user)
        elif target == 'all':
            # Add all staff (teachers, admins)
            staff_users = User.objects.filter(
                Q(userrole__role__name__iexact='teacher') |
                Q(userrole__role__name__iexact='admin') |
                Q(userrole__role__name__iexact='super_admin')
            ).distinct()
            
            for user in staff_users:
                if user.id != request.user.id:
                    GroupChatMember.objects.get_or_create(group_chat=group, user=user)
        
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }
        return Response(response_data, status=201)

    def perform_update(self, serializer):
        if not has_model_permission(self.request.user, 'groupchat', 'change_groupchat', branch_id=None):
            raise PermissionDenied("You do not have permission to update group chats.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_destroy(self, instance):
        if not has_model_permission(self.request.user, 'groupchat', 'delete_groupchat', branch_id=None):
            raise PermissionDenied("You do not have permission to delete group chats.")
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }
        return Response(response_data, status=204)

class GroupChatMemberViewSet(viewsets.ModelViewSet):
    queryset = GroupChatMember.objects.all()
    serializer_class = GroupChatMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'groupchatmember', 'view_groupchatmember', branch_id):
            raise PermissionDenied("You do not have permission to view group chat members in this branch.")
        return self.queryset.filter(user=user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_create(self, serializer):
        group_id = self.request.data.get('group_chat')
        user_id = self.request.data.get('user')
        branch_id = self.request.data.get('branch_id')
        # Check permission for non-superusers
        if not self.request.user.is_superuser:
            if not has_model_permission(self.request.user, 'groupchatmember', 'add_groupchatmember', branch_id):
                raise PermissionDenied("You do not have permission to add group chat members.")

        try:
            group = GroupChat.objects.get(id=group_id)
        except GroupChat.DoesNotExist:
            raise PermissionDenied("Group does not exist.")
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise PermissionDenied("User does not exist.")
        # The serializer uses PrimaryKeyRelatedField, so validated_data already has IDs
        # Just call save() to create the member
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }
        return Response(response_data, status=201)

    def perform_update(self, serializer):
        if not has_model_permission(self.request.user, 'groupchatmember', 'change_groupchatmember', branch_id=None):
            raise PermissionDenied("You do not have permission to update group chat members.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_destroy(self, instance):
        if not has_model_permission(self.request.user, 'groupchatmember', 'delete_groupchatmember', branch_id=None):
            raise PermissionDenied("You do not have permission to delete group chat members.")
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }
        return Response(response_data, status=204)

class GroupChatMessageViewSet(viewsets.ModelViewSet):
    queryset = GroupChatMessage.objects.all()
    serializer_class = GroupChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        group_id = self.request.query_params.get('group')
        
        if branch_id and not has_model_permission(user, 'groupchatmessage', 'view_groupchatmessage', branch_id):
            raise PermissionDenied("You do not have permission to view group chat messages in this branch.")
        
        queryset = self.queryset.filter(group__members__user=user)
        
        # Filter by specific group if provided
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        return queryset.order_by('-timestamp')

    @action(detail=False, methods=['get'], url_path='conversations')
    def conversations(self, request, *args, **kwargs):
        from .models import GroupChatMessage, GroupChat
        user = request.user
        branch_id = request.query_params.get('branch_id')

        if branch_id and not has_model_permission(user, 'groupchatmessage', 'view_groupchatmessage', branch_id):
            raise PermissionDenied("You do not have permission to view group chat messages in this branch.")

        groups = GroupChat.objects.filter(members__user=user).distinct()
        conversations = {}
        for group in groups:
            latest_message = GroupChatMessage.objects.filter(group=group).order_by('-timestamp').first()
            member_count = GroupChatMember.objects.filter(group_chat=group).count()
            if latest_message:
                conversations[group.id] = {
                    'group': group,
                    'latest_message': latest_message.message,
                    'last_timestamp': latest_message.timestamp,
                    'member_count': member_count,
                }

        serializer = GroupChatConversationSummarySerializer(conversations.values(), many=True, context={'request': request})
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='conversation/(?P<group_id>[^/.]+)')
    def conversation(self, request, group_id=None):
        from .models import GroupChatMessage
        user = request.user
        branch_id = request.query_params.get('branch_id')

        if branch_id and not has_model_permission(user, 'groupchatmessage', 'view_groupchatmessage', branch_id):
            raise PermissionDenied("You do not have permission to view group chat messages in this branch.")

        try:
            group = GroupChat.objects.get(id=group_id)
            if not GroupChatMember.objects.filter(group_chat=group, user=user).exists():
                raise PermissionDenied("You are not a member of this group.")
        except GroupChat.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Group not found',
                'status': 404,
                'data': []
            }, status=status.HTTP_404_NOT_FOUND)

        # Fetch all messages for the group
        queryset = GroupChatMessage.objects.filter(group=group).order_by('-timestamp')
        serializer = GroupChatMessageDetailSerializer(queryset, many=True, context={'request': request})
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        group_id = self.request.data.get('group')
        if branch_id and not has_model_permission(self.request.user, 'groupchatmessage', 'add_groupchatmessage', branch_id):
            raise PermissionDenied("You do not have permission to send group chat messages in this branch.")

        try:
            group = GroupChat.objects.get(id=group_id)
            if not GroupChatMember.objects.filter(group_chat=group, user=self.request.user).exists():
                raise PermissionDenied("You are not a member of this group.")
        except GroupChat.DoesNotExist:
            raise PermissionDenied("Group does not exist.")

        serializer.save(sender=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }
        return Response(response_data, status=201)

    def perform_update(self, serializer):
        if not has_model_permission(self.request.user, 'groupchatmessage', 'change_groupchatmessage', branch_id=None):
            raise PermissionDenied("You do not have permission to update group chat messages.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_destroy(self, instance):
        if not has_model_permission(self.request.user, 'groupchatmessage', 'delete_groupchatmessage', branch_id=None):
            raise PermissionDenied("You do not have permission to delete group chat messages.")
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }
        return Response(response_data, status=204)

class ParentFeedbackViewSet(viewsets.ModelViewSet):
    queryset = ParentFeedback.objects.all()
    serializer_class = ParentFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'parentfeedback', 'view_parentfeedback', branch_id):
            raise PermissionDenied("You do not have permission to view parent feedback in this branch.")
        return self.queryset.filter(parent=user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'parentfeedback', 'add_parentfeedback', branch_id):
            raise PermissionDenied("You do not have permission to submit parent feedback in this branch.")
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }
        return Response(response_data, status=201)

    def perform_update(self, serializer):
        if not has_model_permission(self.request.user, 'parentfeedback', 'change_parentfeedback', branch_id=None):
            raise PermissionDenied("You do not have permission to update parent feedback.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_destroy(self, instance):
        if not has_model_permission(self.request.user, 'parentfeedback', 'delete_parentfeedback', branch_id=None):
            raise PermissionDenied("You do not have permission to delete parent feedback.")
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }
        return Response(response_data, status=204)

    @action(detail=False, methods=['get', 'post', 'patch'], url_path='parent_feedback')
    def parent_feedback(self, request, *args, **kwargs):
        user = request.user
        branch_id = request.query_params.get('branch_id')

        if branch_id and not has_model_permission(user, 'parentfeedback', 'view_parentfeedback', branch_id):
            raise PermissionDenied("You do not have permission to view or manage parent feedback in this branch.")

        if request.method == 'GET':
            existing_feedback = self.get_queryset().order_by('-submitted_at')
            serializer = self.get_serializer(existing_feedback, many=True)
            total_ratings_submitted = self.get_queryset().count()
            last_feedback_day = self.get_queryset().aggregate(last=Max('submitted_at'))['last']
            last_feedback_day = last_feedback_day.date().isoformat() if last_feedback_day else None
            average_rating = self.get_queryset().aggregate(avg_rating=Avg('rating'))['avg_rating']
            average_rating = round(average_rating, 2) if average_rating else "N/A"

            your_recent_feedback = {
                'total_ratings_submitted': total_ratings_submitted,
                'last_feedback_day': last_feedback_day,
                'average_rating': average_rating
            }
            return Response({
                'success': True,
                'message': 'OK',
                'status': 200,
                'data': {
                    'your_recent_feedback': your_recent_feedback,
                    'feedback_list': serializer.data
                }
            })

        # POST: Add new feedback for non-rated staff
        elif request.method == 'POST':
            if not has_model_permission(user, 'parentfeedback', 'add_parentfeedback', branch_id):
                raise PermissionDenied("You do not have permission to submit parent feedback.")

            data = request.data.copy()
            data['parent'] = user.id
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response({
                'success': True,
                'message': 'Feedback submitted successfully',
                'status': 201,
                'data': serializer.data
            })

        # PATCH: Edit existing feedback
        elif request.method == 'PATCH':
            feedback_id = request.data.get('id')
            if not feedback_id:
                return Response({
                    'success': False,
                    'message': 'Feedback ID is required for editing',
                    'status': 400,
                    'data': {}
                }, status=400)

            try:
                instance = self.get_queryset().get(id=feedback_id)
                if not has_model_permission(user, 'parentfeedback', 'change_parentfeedback', branch_id):
                    raise PermissionDenied("You do not have permission to update this feedback.")

                serializer = self.get_serializer(instance, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)
                return Response({
                    'success': True,
                    'message': 'Feedback updated successfully',
                    'status': 200,
                    'data': serializer.data
                })
            except ParentFeedback.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Feedback not found',
                    'status': 404,
                    'data': {}
                }, status=404)

@login_required
def chat_view(request, group_id):
    try:
        group = GroupChat.objects.get(id=group_id)
        if not GroupChatMember.objects.filter(group_chat=group, user=request.user).exists():
            response_data = {
                'success': False,
                'message': 'You are not a member of this group.',
                'status': 403,
                'data': []
            }
            return render(request, 'api/communication/templates/communication/error.html', response_data, status=403)
        token = request.session.get('access_token') or request.META.get('HTTP_AUTHORIZATION', '').replace('Bearer ', '')
        if not token:
            response_data = {
                'success': False,
                'message': 'Authentication token not provided.',
                'status': 401,
                'data': []
            }
            return render(request, '/communication/templates/communication/error.html', response_data, status=401)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'token': token,
                'user_id': str(request.user.id),
                'branch_id': request.GET.get('branch_id', ''),
                'group_id': str(group_id),
                'chat_type': 'group'
            }
        }
        return render(
            request,
            'api/communication/templates/communication/chat.html',
            response_data
        )
    except GroupChat.DoesNotExist:
        response_data = {
            'success': False,
            'message': 'Group does not exist.',
            'status': 404,
            'data': []
        }
        return render(request, 'api/communication/templates/communication/error.html', response_data, status=404)

@login_required
def private_chat_view(request, receiver_id):
    try:
        receiver = User.objects.get(id=receiver_id)
        branch_id = request.GET.get('branch_id')
        if branch_id and not has_model_permission(request.user, 'chat', 'view_chat', branch_id):
            response_data = {
                'success': False,
                'message': 'You do not have permission to view chats in this branch.',
                'status': 403,
                'data': []
            }
            return render(request, 'api/communication/templates/communication/error.html', response_data, status=403)
        token = request.session.get('access_token') or request.META.get('HTTP_AUTHORIZATION', '').replace('Bearer ', '')
        if not token:
            response_data = {
                'success': False,
                'message': 'Authentication token not provided.',
                'status': 401,
                'data': []
            }
            return render(request, 'api/communication/templates/communication/error.html', response_data, status=401)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'token': token,
                'user_id': str(request.user.id),
                'branch_id': branch_id or '',
                'receiver_id': str(receiver_id),
                'chat_type': 'private',
                'receiver_name': receiver.full_name
            }
        }
        return render(
            request,
            'api/communication/templates/communication/chat.html',
            response_data
        )
    except User.DoesNotExist:
        response_data = {
            'success': False,
            'message': 'User does not exist.',
            'status': 404,
            'data': []
        }
        return render(request, 'api/communication/templates/communication/error.html', response_data, status=404)
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'success': True, 'message': 'Notification marked as read'})
