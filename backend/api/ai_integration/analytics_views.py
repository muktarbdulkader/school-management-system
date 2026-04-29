"""
Super Admin AI Analytics Dashboard
Provides comprehensive analytics with AI-powered insights and visualization data
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db.models import Count, Avg, Q, F, Sum
from django.utils import timezone
from datetime import timedelta, datetime
from collections import defaultdict

from users.models import User, UserBranchAccess, Branch
from students.models import Student, Parent
from teachers.models import Teacher
from communication.models import Announcement, Chat, ParentFeedback
from tasks.models import Task
from blogs.models import BlogPosts
from schedule.models import Attendance, Exam
from ai_integration.models import AIRequest


class SuperAdminAIDashboardView(APIView):
    """
    Comprehensive AI-powered analytics dashboard for Super Admin
    Provides school overview metrics with AI insights and graph data
    """
    permission_classes = [IsAuthenticated]

    def _safe_call(self, method, default_value=None, *args, **kwargs):
        """Safely call a method and return default value on error"""
        try:
            return method(*args, **kwargs)
        except Exception as e:
            print(f"[AI Dashboard] Error in {method.__name__}: {str(e)}")
            return default_value if default_value is not None else {}

    def get(self, request):
        # Only superusers can access
        if not request.user.is_superuser:
            raise PermissionDenied("Only Super Admin can access this dashboard")

        # Time ranges for analysis
        today = timezone.now().date()
        last_30_days = today - timedelta(days=30)
        last_7_days = today - timedelta(days=7)

        # Gather comprehensive school data with error handling
        data = {
            'overview': self._safe_call(self.get_overview_metrics, {}),
            'users': self._safe_call(self.get_user_analytics, {}),
            'students': self._safe_call(self.get_student_analytics, {}),
            'teachers': self._safe_call(self.get_teacher_analytics, {}),
            'communications': self._safe_call(self.get_communication_analytics, {}, last_30_days),
            'engagement': self._safe_call(self.get_engagement_metrics, {}, last_30_days),
            'graphs': self._safe_call(self.get_graph_data, {}),
        }

        return Response({
            'success': True,
            'message': 'School Analytics Dashboard loaded successfully',
            'status': 200,
            'data': data
        })

    def get_overview_metrics(self):
        """Get high-level school overview metrics"""
        return {
            'total_users': User.objects.filter(is_active=True).count(),
            'total_students': Student.objects.count(),
            'total_teachers': Teacher.objects.count(),
            'total_parents': Parent.objects.count(),
            'total_branches': Branch.objects.count(),
            'active_today': User.objects.filter(last_login__date=timezone.now().date()).count(),
            'new_this_month': User.objects.filter(
                created_at__month=timezone.now().month,
                created_at__year=timezone.now().year
            ).count(),
        }

    def get_user_analytics(self):
        """User role distribution and activity"""
        from users.models import UserRole

        role_dist = UserRole.objects.values('role__name').annotate(
            count=Count('id')
        ).order_by('-count')

        return {
            'role_distribution': list(role_dist),
            'active_users_30d': User.objects.filter(
                last_login__gte=timezone.now() - timedelta(days=30)
            ).count(),
            'inactive_users': User.objects.filter(
                is_active=True,
                last_login__lt=timezone.now() - timedelta(days=30)
            ).count(),
        }

    def get_student_analytics(self):
        """Student performance and enrollment analytics"""
        total = Student.objects.count()
        print(f"[AI Dashboard] Total students: {total}")
        
        # Try multiple approaches to get grade distribution
        grade_dist = []
        try:
            # The Class model has 'grade' field, not 'name'
            grade_dist = list(Student.objects.exclude(grade__isnull=True)
                .values('grade__grade')
                .annotate(count=Count('id'))
                .order_by('grade__grade'))
            print(f"[AI Dashboard] Grade dist (grade__grade): {grade_dist}")
        except Exception as e:
            print(f"[AI Dashboard] Grade__grade error: {e}")
            try:
                # Fallback to just grade ID and lookup names separately
                raw_dist = list(Student.objects.exclude(grade__isnull=True)
                    .values('grade')
                    .annotate(count=Count('id'))
                    .order_by('grade'))
                # Lookup class names
                from django.apps import apps
                ClassModel = apps.get_model('academics', 'Class')
                for item in raw_dist:
                    try:
                        cls = ClassModel.objects.get(id=item['grade'])
                        grade_dist.append({
                            'grade__grade': cls.grade,
                            'count': item['count']
                        })
                    except:
                        grade_dist.append({
                            'grade__grade': str(item['grade'])[:8],
                            'count': item['count']
                        })
                print(f"[AI Dashboard] Grade dist (with lookup): {grade_dist}")
            except Exception as e2:
                print(f"[AI Dashboard] Grade lookup error: {e2}")

        # Gender distribution (if gender field exists)
        gender_dist = []
        try:
            gender_dist = list(Student.objects.exclude(gender__isnull=True).values('gender').annotate(
                count=Count('id')
            ))
        except:
            pass

        try:
            branch_dist = list(Student.objects.values('branch__name').annotate(
                count=Count('id')
            ))
        except:
            branch_dist = []

        return {
            'total_students': total,
            'grade_distribution': grade_dist,
            'gender_distribution': gender_dist,
            'students_by_branch': branch_dist,
            'new_students_this_month': 0,
        }

    def get_teacher_analytics(self):
        """Teacher performance and workload analytics"""
        from django.db.models import Avg

        avg_rating = Teacher.objects.aggregate(avg=Avg('rating'))['avg'] or 0
        avg_attendance = Teacher.objects.aggregate(avg=Avg('attendance_percentage'))['avg'] or 0

        return {
            'total_teachers': Teacher.objects.count(),
            'average_rating': round(avg_rating, 2),
            'average_attendance': round(avg_attendance, 2),
            'teachers_by_branch': list(Teacher.objects.values('branch__name').annotate(
                count=Count('id')
            )),
            'top_rated_teachers': list(Teacher.objects.filter(
                rating__isnull=False
            ).order_by('-rating').values('user__full_name', 'rating')[:5]),
        }

    def get_communication_analytics(self, days):
        """Communication and engagement metrics"""
        cutoff = timezone.now() - timedelta(days=int(days)) if isinstance(days, (int, float)) else timezone.now() - timedelta(days=30)
        
        # Debug counts
        announcement_count = Announcement.objects.count()
        chat_count = Chat.objects.count()
        feedback_count = ParentFeedback.objects.count()
        print(f"[AI Dashboard] Communications: {announcement_count} announcements, {chat_count} chats, {feedback_count} feedback")
        
        # Chat by class/grade - which class chats more
        chat_by_class = []
        try:
            from django.db.models import Q
            # Try to get chats grouped by student class
            chat_by_class = list(Chat.objects.filter(
                sender__student_profile__grade__isnull=False
            ).values('sender__student_profile__grade__grade')
            .annotate(count=Count('id'))
            .order_by('-count'))
            print(f"[AI Dashboard] Chat by class: {chat_by_class}")
        except Exception as e:
            print(f"[AI Dashboard] Chat by class error: {e}")
            try:
                # Alternative - count by student grade
                from students.models import Student
                from academics.models import Class
                class_chats = {}
                for chat in Chat.objects.select_related('sender').all()[:1000]:  # Limit for performance
                    try:
                        student = Student.objects.filter(user=chat.sender).first()
                        if student and student.grade:
                            grade_name = f"Grade {student.grade.grade}"
                            class_chats[grade_name] = class_chats.get(grade_name, 0) + 1
                    except:
                        pass
                chat_by_class = [{'grade__grade': k, 'count': v} for k, v in sorted(class_chats.items(), key=lambda x: -x[1])]
            except Exception as e2:
                print(f"[AI Dashboard] Chat by class fallback error: {e2}")
        
        published_blogs = 0
        try:
            published_blogs = BlogPosts.objects.filter(
                status='published'
            ).count()
        except:
            try:
                published_blogs = BlogPosts.objects.filter(
                    is_published=True
                ).count()
            except:
                published_blogs = BlogPosts.objects.count()
        
        return {
            'total_announcements': announcement_count,
            'announcements_this_month': Announcement.objects.filter(
                created_at__gte=cutoff
            ).count(),
            'messages_last_30d': chat_count,  # Using chats as messages
            'feedback_count': feedback_count,
            'average_feedback_rating': 0,  # Add if rating field exists
            'published_blogs': published_blogs,
            'chat_by_class': chat_by_class,  # Which class chats more
        }

    def get_engagement_metrics(self, since_date):
        """Platform engagement metrics"""
        # Handle Task status field safely
        total_tasks = Task.objects.count()
        task_stats = {'total': total_tasks, 'completed': 0, 'in_progress': 0, 'pending': 0, 'expired': 0}
        try:
            task_stats['completed'] = Task.objects.filter(status='done').count()
            task_stats['in_progress'] = Task.objects.filter(status='in_progress').count()
            task_stats['pending'] = Task.objects.filter(status='to_do').count()
            task_stats['expired'] = Task.objects.filter(
                due_date__lt=timezone.now().date()
            ).exclude(status='done').count()
        except Exception as e:
            print(f"[AI Dashboard] Task stats error: {e}")
            # Try alternative status values
            try:
                task_stats['completed'] = Task.objects.filter(status='completed').count()
                task_stats['in_progress'] = Task.objects.filter(status='in_progress').count()
                task_stats['pending'] = Task.objects.filter(status='pending').count()
            except:
                pass
        
        print(f"[AI Dashboard] Tasks: {total_tasks} total, {task_stats['completed']} done, {task_stats['in_progress']} in progress")

        # Blog stats with fallback for missing fields
        blog_stats = {'total_posts': BlogPosts.objects.count(), 'published': 0, 'draft': 0, 'posts_this_month': 0}
        try:
            blog_stats['published'] = BlogPosts.objects.filter(status='published').count()
            blog_stats['draft'] = BlogPosts.objects.filter(status='draft').count()
        except:
            try:
                blog_stats['published'] = BlogPosts.objects.filter(is_published=True).count()
                blog_stats['draft'] = BlogPosts.objects.filter(is_published=False).count()
            except:
                pass
        try:
            blog_stats['posts_this_month'] = BlogPosts.objects.filter(
                created_at__month=timezone.now().month
            ).count()
        except:
            pass

        # Attendance rate calculation with fallback
        attendance_rate = 0
        total_attendance = 0
        try:
            attendance_qs = Attendance.objects.filter(date__gte=since_date)
            total_attendance = attendance_qs.count()
            present_count = attendance_qs.filter(status='present').count()
            attendance_rate = (present_count / total_attendance * 100) if total_attendance > 0 else 0
        except:
            pass

        return {
            'tasks': task_stats,
            'blogs': blog_stats,
            'attendance_rate': round(attendance_rate, 2),
            'total_attendance_records': total_attendance,
        }

    def get_ai_usage_stats(self):
        """AI feature usage statistics"""
        last_30_days = timezone.now() - timedelta(days=30)

        return {
            'total_ai_requests': AIRequest.objects.count(),
            'requests_this_month': AIRequest.objects.filter(
                created_at__month=timezone.now().month
            ).count(),
            'requests_last_30d': AIRequest.objects.filter(created_at__gte=last_30_days).count(),
            'by_type': list(AIRequest.objects.values('request_type').annotate(
                count=Count('id')
            ).order_by('-count')),
            'by_status': list(AIRequest.objects.values('status').annotate(
                count=Count('id')
            )),
            'top_users': list(AIRequest.objects.values(
                'user__full_name', 'user__email'
            ).annotate(count=Count('id')).order_by('-count')[:5]),
            'success_rate': self.calculate_ai_success_rate(),
        }

    def calculate_ai_success_rate(self):
        """Calculate AI request success rate"""
        total = AIRequest.objects.count()
        if total == 0:
            return 0
        successful = AIRequest.objects.filter(status='completed').count()
        return round((successful / total) * 100, 2)

    def get_graph_data(self):
        """Generate data for charts and graphs"""
        today = timezone.now().date()

        # User growth over last 12 months
        months = []
        user_growth = []
        for i in range(11, -1, -1):
            month_date = today - timedelta(days=30*i)
            month_label = month_date.strftime('%b %Y')
            months.append(month_label)
            count = User.objects.filter(
                created_at__month=month_date.month,
                created_at__year=month_date.year
            ).count()
            user_growth.append(count)

        # Daily active users (last 7 days)
        last_7_days = []
        daily_active = []
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            last_7_days.append(date.strftime('%a %m/%d'))
            count = User.objects.filter(last_login__date=date).count()
            daily_active.append(count)

        # AI requests by type (pie chart data)
        ai_by_type = list(AIRequest.objects.values('request_type').annotate(
            value=Count('id')
        ))

        # Student enrollment by grade (bar chart)
        grade_data = []
        try:
            # Try to import and query Class model - use 'grade' field not 'name'
            from django.apps import apps
            ClassModel = apps.get_model('academics', 'Class')
            
            for cls in ClassModel.objects.all().order_by('grade'):
                count = Student.objects.filter(grade=cls).count()
                if count > 0:
                    grade_data.append({
                        'grade__name': f"Grade {cls.grade}",
                        'grade__grade': cls.grade,
                        'grade': str(cls.id),
                        'students': count
                    })
            print(f"[AI Dashboard] Grade data loaded: {len(grade_data)} grades with {sum(g['students'] for g in grade_data)} students")
        except Exception as e:
            print(f"[AI Dashboard] Error loading grade data: {str(e)}")
            # Fallback - use grade IDs and lookup
            try:
                raw_data = list(Student.objects.filter(grade__isnull=False)
                    .values('grade')
                    .annotate(students=Count('id'))
                    .order_by('grade'))
                from django.apps import apps
                ClassModel = apps.get_model('academics', 'Class')
                for item in raw_data:
                    try:
                        cls = ClassModel.objects.get(id=item['grade'])
                        grade_data.append({
                            'grade__name': f"Grade {cls.grade}",
                            'grade__grade': cls.grade,
                            'students': item['students']
                        })
                    except:
                        grade_data.append({
                            'grade__name': f"Class {str(item['grade'])[:8]}",
                            'students': item['students']
                        })
                print(f"[AI Dashboard] Grade data from fallback: {len(grade_data)} grades")
            except Exception as e2:
                print(f"[AI Dashboard] Fallback also failed: {str(e2)}")
                grade_data = []

        # Task status distribution
        task_status = []
        try:
            task_status = [
                {'name': 'Completed', 'value': Task.objects.filter(status='done').count()},
                {'name': 'In Progress', 'value': Task.objects.filter(status='in_progress').count()},
                {'name': 'To Do', 'value': Task.objects.filter(status='to_do').count()},
                {'name': 'Expired', 'value': Task.objects.filter(
                    due_date__lt=today
                ).exclude(status='done').count()},
            ]
        except:
            # Fallback if status field doesn't exist
            task_status = [{'name': 'Tasks', 'value': Task.objects.count()}]

        return {
            'user_growth': {
                'labels': months,
                'data': user_growth,
            },
            'daily_active_users': {
                'labels': last_7_days,
                'data': daily_active,
            },
            'students_by_grade': grade_data,
            'task_status_distribution': task_status,
        }

    def generate_ai_insights(self):
        """Generate AI-powered insights about the school"""
        # Use batch analysis for key metrics
        from ai_integration.services import get_ai_service
        from ai_integration.utils import batch_ai_analyze
        import os

        insights = {
            'summary': '',
            'key_findings': [],
            'recommendations': [],
        }

        try:
            # Check if AI provider is configured
            provider = os.environ.get('AI_PROVIDER', 'mock')
            service = get_ai_service()
            
            insights['key_findings'].append(f"AI Provider: {provider}")
            insights['key_findings'].append(f"Service: {service.__class__.__name__}")

            # Analyze student distribution - use safe field access
            try:
                student_items = list(Student.objects.values('grade', 'section')[:30])
            except:
                student_items = list(Student.objects.values('id', 'grade_id', 'section_id')[:30])

            if student_items:
                try:
                    student_result = service.batch_summarize(student_items, 'overview')
                    insights['summary'] = student_result.summary if student_result else 'Analysis complete'
                    if student_result and student_result.key_insights:
                        insights['key_findings'].extend(student_result.key_insights[:3])
                except Exception as ai_error:
                    insights['key_findings'].append(f"AI Analysis Note: {str(ai_error)}")
                    insights['summary'] = f"Basic analysis complete. AI features using {provider} provider."

            # Generate recommendations based on data
            recommendations = []

            # Check attendance rates
            try:
                attendance_rate = self.get_engagement_metrics(timezone.now().date() - timedelta(days=30))['attendance_rate']
                if attendance_rate < 80:
                    recommendations.append("Attendance rate is below 80%. Consider implementing attendance improvement initiatives.")
            except Exception:
                pass  # Skip if metrics not available

            # Check AI usage
            ai_stats = self.get_ai_usage_stats()
            if ai_stats['requests_this_month'] < 10:
                recommendations.append("Low AI feature usage detected. Consider promoting AI tools to staff.")

            # Check task completion rate
            task_stats = self.get_engagement_metrics(timezone.now().date() - timedelta(days=30))['tasks']
            total_tasks = task_stats['total'] or 1
            completion_rate = (task_stats['completed'] / total_tasks) * 100
            if completion_rate < 60:
                recommendations.append(f"Task completion rate is {completion_rate:.1f}%. Consider reviewing task management workflows.")

            insights['recommendations'] = recommendations

        except Exception as e:
            insights['summary'] = f"AI insights generation in progress. Error: {str(e)}"

        return insights


class SchoolOverviewReportView(APIView):
    """
    Generate comprehensive school overview report with AI summary
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            raise PermissionDenied("Only Super Admin can generate reports")

        from ai_integration.services import get_ai_service

        # Gather key metrics
        metrics = {
            'total_students': Student.objects.count(),
            'total_teachers': Teacher.objects.count(),
            'total_parents': Parent.objects.count(),
            'branches': list(Branch.objects.values('name', 'code')),
            'recent_announcements': Announcement.objects.count(),
            'active_tasks': Task.objects.exclude(status='done').count(),
        }

        # Generate AI summary
        try:
            service = get_ai_service()
            text = f"School Overview: {metrics['total_students']} students, {metrics['total_teachers']} teachers, {metrics['total_parents']} parents across {len(metrics['branches'])} branches. Active tasks: {metrics['active_tasks']}"
            summary = service.summarize(text, 300, 'detailed')

            return Response({
                'success': True,
                'data': {
                    'metrics': metrics,
                    'ai_summary': summary.summary if summary else '',
                    'key_points': summary.key_insights if summary else [],
                }
            })
        except Exception as e:
            return Response({
                'success': True,
                'data': {
                    'metrics': metrics,
                    'ai_summary': 'AI summary generation in progress',
                    'error': str(e)
                }
            })
