from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import CustomTokenObtainPairSerializer

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
