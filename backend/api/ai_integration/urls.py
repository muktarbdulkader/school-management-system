from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .views import (
    GrammarCheckView,
    SummarizeView,
    ExplainView,
    BatchSummarizeView,
    AIRequestHistoryView,
    AIStatusView
)
from .analytics_views import SuperAdminAIDashboardView, SchoolOverviewReportView


class AITestView(APIView):
    """Quick test endpoint to verify AI is working"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        import os
        from .services import get_ai_service
        
        provider = os.environ.get('AI_PROVIDER', 'mock')
        
        try:
            service = get_ai_service()
            # Try a simple test
            result = service.check_grammar("The students needs to study.")
            
            return Response({
                'success': True,
                'message': 'AI service is working',
                'provider': provider,
                'service_class': service.__class__.__name__,
                'test_result': {
                    'corrected_text': result.corrected_text,
                    'errors_found': result.errors_found
                }
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': f'AI service error: {str(e)}',
                'provider': provider,
                'error': str(e)
            }, status=500)


urlpatterns = [
    path('grammar-check/', GrammarCheckView.as_view(), name='ai-grammar-check'),
    path('summarize/', SummarizeView.as_view(), name='ai-summarize'),
    path('explain/', ExplainView.as_view(), name='ai-explain'),
    path('batch-summarize/', BatchSummarizeView.as_view(), name='ai-batch-summarize'),
    path('history/', AIRequestHistoryView.as_view(), name='ai-history'),
    path('status/', AIStatusView.as_view(), name='ai-status'),
    path('test/', AITestView.as_view(), name='ai-test'),
    # Super Admin Analytics Dashboard
    path('admin/dashboard/', SuperAdminAIDashboardView.as_view(), name='ai-admin-dashboard'),
    path('admin/school-report/', SchoolOverviewReportView.as_view(), name='ai-school-report'),
]
