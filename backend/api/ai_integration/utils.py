"""
AI Integration Utilities
Helper functions to easily add AI features to any ViewSet
"""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .services import get_ai_service
from .models import AIRequest


def add_ai_actions(viewset_class, text_field='description', summary_field=None):
    """
    Decorator to add AI actions to a ViewSet
    Adds: grammar_check, summarize, explain actions
    
    Usage:
        @add_ai_actions(text_field='content')
        class MyViewSet(viewsets.ModelViewSet):
            ...
    """
    
    @action(detail=True, methods=['post'], url_path='grammar-check')
    def grammar_check(self, request, pk=None):
        """Check grammar on object's text field"""
        instance = self.get_object()
        text = getattr(instance, text_field, '')
        
        if not text:
            return Response({
                'success': False,
                'message': f'No text found in field: {text_field}',
                'status': 400
            }, status=400)
        
        ai_request = AIRequest.objects.create(
            user=request.user,
            request_type='grammar',
            input_text=text[:1000],
            status='processing',
            error_message=''
        )
        
        try:
            service = get_ai_service()
            result = service.check_grammar(text)
            
            ai_request.status = 'completed'
            ai_request.output_text = result.corrected_text
            ai_request.provider = service.__class__.__name__
            ai_request.completed_at = timezone.now()
            ai_request.save()
            
            return Response({
                'success': True,
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
                'message': str(e),
                'status': 500
            }, status=500)
    
    @action(detail=True, methods=['post'], url_path='summarize')
    def summarize_object(self, request, pk=None):
        """Summarize object's text field"""
        instance = self.get_object()
        text = getattr(instance, text_field, '')
        
        if not text:
            return Response({
                'success': False,
                'message': f'No text found in field: {text_field}',
                'status': 400
            }, status=400)
        
        max_length = request.data.get('max_length', 150)
        style = request.data.get('style', 'concise')
        
        ai_request = AIRequest.objects.create(
            user=request.user,
            request_type='summarize',
            input_text=text[:1000],
            status='processing',
            error_message=''
        )
        
        try:
            service = get_ai_service()
            result = service.summarize(text, max_length, style)
            
            ai_request.status = 'completed'
            ai_request.output_text = result.summary
            ai_request.provider = service.__class__.__name__
            ai_request.completed_at = timezone.now()
            ai_request.save()
            
            return Response({
                'success': True,
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
                'message': str(e),
                'status': 500
            }, status=500)
    
    @action(detail=True, methods=['post'], url_path='explain')
    def explain_object(self, request, pk=None):
        """Explain object's content"""
        instance = self.get_object()
        text = getattr(instance, text_field, '')
        
        if not text:
            return Response({
                'success': False,
                'message': f'No text found in field: {text_field}',
                'status': 400
            }, status=400)
        
        audience = request.data.get('audience', 'intermediate')
        format_type = request.data.get('format', 'paragraph')
        
        ai_request = AIRequest.objects.create(
            user=request.user,
            request_type='explain',
            input_text=text[:1000],
            status='processing',
            error_message=''
        )
        
        try:
            service = get_ai_service()
            result = service.explain(text, audience, format_type)
            
            ai_request.status = 'completed'
            ai_request.output_text = result
            ai_request.provider = service.__class__.__name__
            ai_request.completed_at = timezone.now()
            ai_request.save()
            
            return Response({
                'success': True,
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
                'message': str(e),
                'status': 500
            }, status=500)
    
    # Add actions to the viewset
    viewset_class.grammar_check = grammar_check
    viewset_class.summarize_object = summarize_object
    viewset_class.explain_object = explain_object
    
    return viewset_class


def batch_ai_analyze(queryset, analysis_type='overview', text_field='description'):
    """
    Batch analyze a queryset of objects
    Returns AI-generated summary of the collection
    """
    items = []
    for obj in queryset[:50]:  # Limit to 50 items
        item_data = {
            'id': str(getattr(obj, 'id', '')),
            'text': getattr(obj, text_field, '')[:500] if text_field else '',
        }
        # Add common fields if they exist
        for field in ['name', 'title', 'status', 'grade', 'created_at']:
            if hasattr(obj, field):
                value = getattr(obj, field)
                item_data[field] = str(value) if value else ''
        items.append(item_data)
    
    if not items:
        return None
    
    service = get_ai_service()
    return service.batch_summarize(items, analysis_type)
