import uuid
import secrets
import random
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import CustomTokenObtainPairSerializer
from .models import User, PasswordResetToken

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            # Extract user-friendly error message
            error_detail = 'Invalid credentials. Please check your email/ID and password.'

            if hasattr(e, 'detail'):
                if isinstance(e.detail, dict):
                    error_detail = e.detail.get('detail', error_detail)
                elif isinstance(e.detail, list) and len(e.detail) > 0:
                    error_detail = str(e.detail[0])
                else:
                    error_detail = str(e.detail)

            return Response({
                'success': False,
                'message': error_detail,
                'status': 401
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Get the token data
        token_data = serializer.validated_data

        # Format response to match frontend expectations
        response_data = {
            'success': True,
            'message': 'Login successful',
            'status': 200,
            'data': {
                'access_token': token_data['access'],
                'refresh_token': token_data['refresh'],
                'user': token_data['user'],
                'expires_in': 3600  # 1 hour in seconds (adjust based on your JWT settings)
            }
        }

        return Response(response_data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            return Response({
                'success': True,
                'message': 'Logout successful',
                'status': 200
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Logout failed',
                'detail': str(e),
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    """
    Send password reset email with token link
    POST /api/forgot-password/
    Body: { "email": "user@example.com" }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({
                'success': False,
                'message': 'Email is required',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Return success even if user doesn't exist (security)
            return Response({
                'success': True,
                'message': 'If an account exists, a password reset email has been sent.',
                'status': 200
            }, status=status.HTTP_200_OK)

        # Generate 6-digit reset code
        reset_code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(minutes=15)

        # Save code
        PasswordResetToken.objects.create(
            user=user,
            token=reset_code,
            expires_at=expires_at
        )

        # Get user's name from full_name
        user_name = user.full_name if user.full_name else 'User'

        # Send email with code
        try:
            email_message = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              MALD SCHOOL MANAGEMENT SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PASSWORD RESET REQUEST

Dear {user_name},

You have requested to reset your password for your MALD School account.

Your 6-digit verification code is: {reset_code}

This code will expire in 15 minutes for your security.

If you did not request this password reset, please ignore this email
and your account will remain secure.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
© {timezone.now().year} MALD School. All rights reserved.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            """
            send_mail(
                subject='MALD School - Password Reset Code',
                message=email_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            # Log error but don't expose it to user
            print(f"[ForgotPassword] Email sending failed: {e}")
            return Response({
                'success': True,
                'message': 'If an account exists, a password reset email has been sent.',
                'debug_code': reset_code if settings.DEBUG else None,
                'status': 200
            }, status=status.HTTP_200_OK)

        return Response({
            'success': True,
            'message': 'Password reset code sent. Please check your inbox.',
            'status': 200
        }, status=status.HTTP_200_OK)


class VerifyResetCodeView(APIView):
    """
    Verify reset code without changing password
    POST /api/verify-reset-code/
    Body: { "email": "...", "code": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not all([email, code]):
            return Response({
                'success': False,
                'message': 'Email and code are required',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid email or code',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            reset_token = PasswordResetToken.objects.get(
                user=user,
                token=code,
                is_used=False
            )
        except PasswordResetToken.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid or expired verification code',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        if not reset_token.is_valid():
            return Response({
                'success': False,
                'message': 'Verification code has expired. Please request a new one.',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': 'Code verified successfully',
            'status': 200
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    Reset password using token
    POST /api/reset-password/
    Body: { "token": "...", "email": "...", "new_password": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        email = request.data.get('email')
        new_password = request.data.get('new_password')

        if not all([token, email, new_password]):
            return Response({
                'success': False,
                'message': 'Token, email, and new_password are required',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate password strength
        if len(new_password) < 8:
            return Response({
                'success': False,
                'message': 'Password must be at least 8 characters long',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid reset request',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        # Find valid token
        try:
            reset_token = PasswordResetToken.objects.get(
                user=user,
                token=token,
                is_used=False
            )
        except PasswordResetToken.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid or expired reset token',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if token is expired
        if not reset_token.is_valid():
            return Response({
                'success': False,
                'message': 'Reset token has expired. Please request a new one.',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        # Update password
        user.set_password(new_password)
        user.save()

        # Mark token as used
        reset_token.is_used = True
        reset_token.save()

        return Response({
            'success': True,
            'message': 'Password has been reset successfully. Please log in with your new password.',
            'status': 200
        }, status=status.HTTP_200_OK)
