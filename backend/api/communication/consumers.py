import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import PermissionDenied
from .models import Chat, GroupChat, GroupChatMember, GroupChatMessage
from users.models import has_model_permission

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Extract token from query string
        query_string = self.scope['query_string'].decode()
        params = dict(q.split('=') for q in query_string.split('&') if '=' in q)
        token = params.get('token')
        branch_id = params.get('branch_id')

        # Authenticate user with JWT
        user = await self.authenticate_user(token)
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.scope['user'] = user  # Set user in scope for permission checks

        if branch_id and not await database_sync_to_async(has_model_permission)(user, 'chat', 'view_chat', branch_id):
            await self.send(text_data=json.dumps({'error': 'You do not have permission to view chats in this branch.'}))
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data['message']
            sender_id = str(data['sender_id'])
            receiver_id = data.get('receiver_id')
            branch_id = data.get('branch_id')

            user = self.scope['user']
            if str(user.id) != sender_id or not user.is_authenticated:
                raise PermissionDenied("Invalid sender")

            if not receiver_id:
                raise PermissionDenied("Receiver ID is required.")

            if branch_id and not await database_sync_to_async(has_model_permission)(user, 'chat', 'add_chat', branch_id):
                raise PermissionDenied("You do not have permission to create chats in this branch.")

            try:
                receiver = await database_sync_to_async(User.objects.get)(pk=receiver_id)
            except User.DoesNotExist:
                raise PermissionDenied("Receiver does not exist.")

            chat = await self.save_message(sender_id, receiver_id, message)
            message_id = str(chat.id)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender_id': sender_id,
                    'receiver_id': receiver_id,
                    'message_id': message_id,
                    'timestamp': chat.timestamp.isoformat(),
                    'sender_name': user.full_name
                }
            )
        except Exception as e:
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'receiver_id': event['receiver_id'],
            'message_id': event['message_id'],
            'timestamp': event['timestamp'],
            'sender_name': event['sender_name']
        }))

    @database_sync_to_async
    def authenticate_user(self, token):
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            return jwt_auth.get_user(validated_token)
        except Exception:
            return None

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, message):
        try:
            sender = User.objects.get(id=sender_id)
            receiver = User.objects.get(id=receiver_id)
            return Chat.objects.create(
                sender=sender,
                receiver=receiver,
                message=message
            )
        except User.DoesNotExist:
            raise PermissionDenied("Invalid sender or receiver")

class GroupChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.room_group_name = f'groupchat_{self.group_id}'

        # Extract token from query string
        query_string = self.scope['query_string'].decode()
        params = dict(q.split('=') for q in query_string.split('&') if '=' in q)
        token = params.get('token')
        branch_id = params.get('branch_id')

        # Authenticate user with JWT
        user = await self.authenticate_user(token)
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.scope['user'] = user

        if branch_id and not await database_sync_to_async(has_model_permission)(user, 'groupchatmessage', 'view_groupchatmessage', branch_id):
            await self.send(text_data=json.dumps({'error': 'You do not have permission to view group chat messages in this branch.'}))
            await self.close(code=4003)
            return

        if not await database_sync_to_async(GroupChatMember.objects.filter)(group_chat_id=self.group_id, user=user).exists():
            await self.send(text_data=json.dumps({'error': 'You are not a member of this group.'}))
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data['message']
            sender_id = str(data['sender_id'])
            branch_id = data.get('branch_id')

            user = self.scope['user']
            if str(user.id) != sender_id or not user.is_authenticated:
                raise PermissionDenied("Invalid sender")

            if branch_id and not await database_sync_to_async(has_model_permission)(user, 'groupchatmessage', 'add_groupchatmessage', branch_id):
                raise PermissionDenied("You do not have permission to send group chat messages in this branch.")

            if not await database_sync_to_async(GroupChatMember.objects.filter)(group_chat_id=self.group_id, user=user).exists():
                raise PermissionDenied("You are not a member of this group.")

            chat_message = await self.save_group_message(sender_id, self.group_id, message)
            message_id = str(chat_message.id)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'group_chat_message',
                    'message': message,
                    'sender_id': sender_id,
                    'message_id': message_id,
                    'timestamp': chat_message.timestamp.isoformat(),
                    'sender_name': user.full_name
                }
            )
        except Exception as e:
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def group_chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'message_id': event['message_id'],
            'timestamp': event['timestamp'],
            'sender_name': event['sender_name']
        }))

    @database_sync_to_async
    def authenticate_user(self, token):
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            return jwt_auth.get_user(validated_token)
        except Exception:
            return None

    @database_sync_to_async
    def save_group_message(self, sender_id, group_id, message):
        try:
            sender = User.objects.get(id=sender_id)
            group = GroupChat.objects.get(id=group_id)
            return GroupChatMessage.objects.create(
                sender=sender,
                group=group,
                message=message
            )
        except (User.DoesNotExist, GroupChat.DoesNotExist):
            raise PermissionDenied("Invalid sender or group")
