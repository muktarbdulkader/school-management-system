"""
AI Integration API Views
Provides endpoints for grammar checking, text summarization, and explanation
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .serializers import (
    GrammarCheckRequestSerializer,
    GrammarCheckResponseSerializer,
    SummarizeRequestSerializer,
    SummarizeResponseSerializer,
    ExplainRequestSerializer,
    BatchSummarizeRequestSerializer,
    BatchSummaryResponseSerializer,
    AIRequestSerializer
)
from .services import get_ai_service
from .models import AIRequest


class GrammarCheckView(APIView):
    """Check grammar and spelling in text"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = GrammarCheckRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid request data',
                'errors': serializer.errors,
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)
        
        text = serializer.validated_data['text']
        language = serializer.validated_data.get('language', 'en')
        
        # Create request record
        ai_request = AIRequest.objects.create(
            user=request.user,
            request_type='grammar',
            input_text=text,
            status='processing'
        )
        
        try:
            # Get AI service and process
            service = get_ai_service()
            result = service.check_grammar(text, language)
            
            # Update request record
            ai_request.status = 'completed'
            ai_request.output_text = result.corrected_text
            ai_request.provider = service.__class__.__name__
            ai_request.completed_at = timezone.now()
            ai_request.save()
            
            return Response({
                'success': True,
                'message': 'Grammar check completed',
                'status': 200,
                'data': {
                    'original_text': result.original_text,
                    'corrected_text': result.corrected_text,
                    'suggestions': result.suggestions,
                    'errors_found': result.errors_found
                }
            })
            
        except Exception as e:
            ai_request.status = 'failed'
            ai_request.error_message = str(e)
            ai_request.save()
            
            return Response({
                'success': False,
                'message': f'Grammar check failed: {str(e)}',
                'status': 500
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SummarizeView(APIView):
    """Summarize text content"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = SummarizeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid request data',
                'errors': serializer.errors,
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)
        
        text = serializer.validated_data['text']
        max_length = serializer.validated_data.get('max_length', 150)
        style = serializer.validated_data.get('style', 'concise')
        
        # Create request record
        ai_request = AIRequest.objects.create(
            user=request.user,
            request_type='summarize',
            input_text=text[:1000] + '...' if len(text) > 1000 else text,
            error_message='',
            status='processing'
        )
        
        try:
            # Get AI service and process
            service = get_ai_service()
            result = service.summarize(text, max_length, style)
            
            # Update request record
            ai_request.status = 'completed'
            ai_request.output_text = result.summary
            ai_request.provider = service.__class__.__name__
            ai_request.completed_at = timezone.now()
            ai_request.save()
            
            return Response({
                'success': True,
                'message': 'Summarization completed',
                'status': 200,
                'data': {
                    'original_length': result.original_length,
                    'summary': result.summary,
                    'summary_length': result.summary_length,
                    'compression_ratio': round(result.compression_ratio, 2),
                    'key_insights': result.key_insights or []
                }
            })
            
        except Exception as e:
            ai_request.status = 'failed'
            ai_request.error_message = str(e)
            ai_request.save()
            
            return Response({
                'success': False,
                'message': f'Summarization failed: {str(e)}',
                'status': 500
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExplainView(APIView):
    """Explain text with customizable audience and format"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ExplainRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid request data',
                'errors': serializer.errors,
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)
        
        text = serializer.validated_data['text']
        audience = serializer.validated_data.get('audience', 'intermediate')
        format_type = serializer.validated_data.get('format', 'paragraph')
        
        # Create request record
        ai_request = AIRequest.objects.create(
            user=request.user,
            request_type='explain',
            input_text=text[:1000] + '...' if len(text) > 1000 else text,
            error_message='',
            status='processing'
        )
        
        try:
            # Get AI service and process
            service = get_ai_service()
            result = service.explain(text, audience, format_type)
            
            # Update request record
            ai_request.status = 'completed'
            ai_request.output_text = result
            ai_request.provider = service.__class__.__name__
            ai_request.completed_at = timezone.now()
            ai_request.save()
            
            return Response({
                'success': True,
                'message': 'Explanation generated',
                'status': 200,
                'data': {
                    'explanation': result,
                    'audience': audience,
                    'format': format_type
                }
            })
            
        except Exception as e:
            ai_request.status = 'failed'
            ai_request.error_message = str(e)
            ai_request.save()
            
            return Response({
                'success': False,
                'message': f'Explanation failed: {str(e)}',
                'status': 500
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BatchSummarizeView(APIView):
    """Summarize a collection of data items"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = BatchSummarizeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid request data',
                'errors': serializer.errors,
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)
        
        items = serializer.validated_data['items']
        summary_type = serializer.validated_data.get('summary_type', 'overview')
        
        # Create request record
        ai_request = AIRequest.objects.create(
            user=request.user,
            request_type='summarize',
            input_text=f"Batch: {len(items)} items",
            error_message='',
            status='processing'
        )
        
        try:
            # Get AI service and process
            service = get_ai_service()
            result = service.batch_summarize(items, summary_type)
            
            # Update request record
            ai_request.status = 'completed'
            ai_request.output_text = result.summary
            ai_request.provider = service.__class__.__name__
            ai_request.completed_at = timezone.now()
            ai_request.save()
            
            return Response({
                'success': True,
                'message': 'Batch summarization completed',
                'status': 200,
                'data': {
                    'data_count': len(items),
                    'summary': result.summary,
                    'summary_length': result.summary_length,
                    'key_insights': result.key_insights or []
                }
            })
            
        except Exception as e:
            ai_request.status = 'failed'
            ai_request.error_message = str(e)
            ai_request.save()
            
            return Response({
                'success': False,
                'message': f'Batch summarization failed: {str(e)}',
                'status': 500
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIRequestHistoryView(APIView):
    """Get user's AI request history"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        
        requests = AIRequest.objects.filter(user=request.user)[offset:offset + limit]
        serializer = AIRequestSerializer(requests, many=True)
        
        return Response({
            'success': True,
            'message': 'Request history retrieved',
            'status': 200,
            'data': {
                'requests': serializer.data,
                'total': AIRequest.objects.filter(user=request.user).count()
            }
        })


class AIStatusView(APIView):
    """Check AI service status and configuration"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        import os
        
        provider = os.environ.get('AI_PROVIDER', 'mock').lower()
        
        # Check API keys
        has_openai_key = bool(os.environ.get('OPENAI_API_KEY'))
        has_gemini_key = bool(os.environ.get('GEMINI_API_KEY'))
        has_groq_key = bool(os.environ.get('GROQ_API_KEY'))
        
        available_providers = ['mock']
        if has_openai_key:
            available_providers.append('openai')
        if has_gemini_key:
            available_providers.append('gemini')
        if has_groq_key:
            available_providers.append('groq')
        
        return Response({
            'success': True,
            'message': 'AI service status',
            'status': 200,
            'data': {
                'current_provider': provider,
                'available_providers': available_providers,
                'features': {
                    'grammar_check': True,
                    'summarization': True,
                    'explanation': True,
                    'batch_summarization': True
                },
                'limits': {
                    'max_text_length': 50000,
                    'max_batch_items': 50,
                    'max_summary_length': 500
                }
            }
        })
