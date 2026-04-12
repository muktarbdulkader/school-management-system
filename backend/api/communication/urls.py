from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ChatHistoryViewSet, ChatViewSet, GroupChatMemberViewSet, GroupChatMessageViewSet, GroupChatViewSet, MeetingViewSet, AnnouncementViewSet, ParentFeedbackViewSet, NotificationViewSet, chat_view, private_chat_view

router = DefaultRouter()
router.register(r'chats', ChatViewSet)
router.register(r'chat_history', ChatHistoryViewSet, basename='chat_history')
router.register(r'meetings', MeetingViewSet, basename="meetings")
router.register(r'announcements', AnnouncementViewSet)
router.register(r'group_chats', GroupChatViewSet)
router.register(r'group_chat_members', GroupChatMemberViewSet)
router.register(r'group_chat_messages', GroupChatMessageViewSet)
router.register(r'feedbacks', ParentFeedbackViewSet)
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('test_chat/<uuid:group_id>/', chat_view, name='test_chat'),
    path('test_chat/private/<uuid:receiver_id>/', private_chat_view, name='test_private_chat')
]

urlpatterns += router.urls
