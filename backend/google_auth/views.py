import json

from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from allauth.socialaccount.models import SocialAccount
import requests
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status


class GoogleAuthService:
    @staticmethod
    def verify_google_token(token):
        try:
            response = requests.get(
                'https://www.googleapis.com/oauth2/v3/tokeninfo',
                params={'id_token': token},
                timeout=5
            )

            if response.status_code != 200:
                print(f"Failed to verify Google token: {response.text}")
                return None

            return response.json()
        except requests.RequestException as e:
            print(f"Error verifying Google token: {str(e)}")
            return None

    @staticmethod
    def get_or_create_user(google_data):
        try:
            social_account = SocialAccount.objects.get(
                provider='google',
                uid=google_data['sub']
            )
            return social_account.user, False, social_account

        except SocialAccount.DoesNotExist:
            created = False
            try:
                user = User.objects.get(email=google_data['email'])
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=google_data['email'],
                    email=google_data['email'],
                    first_name=google_data.get('given_name', ''),
                    last_name=google_data.get('family_name', '')
                )
                created = True

            social_account = SocialAccount.objects.create(
                user=user,
                provider='google',
                uid=google_data['sub'],
                extra_data=google_data
            )

            return user, created, social_account


@method_decorator(csrf_exempt, name='dispatch')
class GoogleLoginView(View):
    def post(self, request):
        try:
            if request.content_type == 'application/json':
                data = json.loads(request.body)
            else:
                data = request.POST

            id_token = data.get('credential')

            if not id_token:
                return JsonResponse({'error': 'No token provided'}, status=400)

            google_data = GoogleAuthService.verify_google_token(id_token)

            if not google_data:
                return JsonResponse({'error': 'Invalid token'}, status=400)

            user, created, social_account = GoogleAuthService.get_or_create_user(google_data)

            login(request, user)

            if not settings.SESSION_EXPIRE_AT_BROWSER_CLOSE:
                request.session.set_expiry(settings.SESSION_COOKIE_AGE)

            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'is_authenticated': True,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'google_id': social_account.uid,
                    'profile_picture': google_data.get('picture'),
                    'is_new_user': created
                }
            })

        except Exception as e:
            print(f"Error in Google login: {str(e)}")
            return JsonResponse({'error': 'Authentication failed'}, status=500)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class UserInfoView(APIView):
    permission_classes = []

    def get(self, request):
        try:
            if not request.user.is_authenticated:
                return Response({
                    'is_authenticated': False
                })

            social_account = request.user.socialaccount_set.filter(provider='google').first()

            profile_picture = None
            google_id = None

            if social_account:
                google_id = social_account.uid
                profile_picture = social_account.extra_data.get('picture')

            data = {
                'id': request.user.id,
                'is_authenticated': True,
                'username': request.user.username,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'email': request.user.email,
                'google_id': google_id,
                'profile_picture': profile_picture
            }
            return Response(data)

        except Exception as e:
            print(f"Error retrieving user info: {str(e)}")
            return Response({'error': 'Failed to retrieve user information'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(require_http_methods(["POST"]), name='dispatch')
class LogoutView(View):
    def post(self, request):
        try:
            logout(request)
            return JsonResponse({'success': True})
        except Exception as e:
            print(f"Error during logout: {str(e)}")
            return JsonResponse({'error': 'Logout failed'}, status=500)
