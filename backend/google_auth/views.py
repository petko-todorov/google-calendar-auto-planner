import datetime
import json
import time

from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from allauth.socialaccount.models import SocialAccount, SocialToken, SocialApp
import requests
from rest_framework.permissions import IsAuthenticated
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
            # created = False
            # try:
            #     user = User.objects.get(email=google_data['email'])
            # except User.DoesNotExist:
            #     user = User.objects.create_user(
            #         username=google_data['email'],
            #         email=google_data['email'],
            #         first_name=google_data.get('given_name', ''),
            #         last_name=google_data.get('family_name', '')
            #     )
            #     created = True
            user, created = User.objects.get_or_create(
                email=google_data['email'],
                defaults={
                    'username': google_data['email'],
                    'first_name': google_data.get('given_name', ''),
                    'last_name': google_data.get('family_name', '')
                }
            )

            social_account = SocialAccount.objects.create(
                user=user,
                provider='google',
                uid=google_data['sub'],
                extra_data=google_data
            )

            return user, created, social_account


# @method_decorator(csrf_exempt, name='dispatch')
class GoogleLoginView(APIView):
    def post(self, request):
        try:
            data = json.loads(request.body)
            code = data.get('code')
            if not code:
                return JsonResponse({'error': 'No authorization code provided'}, status=400)

            token_url = 'https://oauth2.googleapis.com/token'
            token_data = {
                'code': code,
                'client_id': settings.GOOGLE_CLIENT_ID,
                'client_secret': settings.GOOGLE_CLIENT_SECRET,
                'redirect_uri': 'postmessage',
                'grant_type': 'authorization_code'
            }
            token_response = requests.post(token_url, data=token_data, timeout=5)
            # print(token_response.text)
            if token_response.status_code != 200:
                return JsonResponse({'error': f'Failed to exchange token: {token_response.text}'}, status=400)

            token_json = token_response.json()

            id_token = token_json.get('id_token')
            if not id_token:
                return JsonResponse({'error': 'No ID token received from Google'}, status=400)

            google_data = GoogleAuthService.verify_google_token(id_token)
            if not google_data:
                return JsonResponse({'error': 'Invalid Google token'}, status=400)

            user, created, social_account = GoogleAuthService.get_or_create_user(google_data)
            login(request, user)

            response_data = {
                'success': True,
                'user': {
                    'id': user.id,
                    'is_authenticated': True,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'google_id': social_account.uid if social_account else None,
                    'profile_picture': google_data.get('picture'),
                    'is_new_user': created
                }
            }

            response = HttpResponse(
                json.dumps(response_data),
                content_type='application/json'
            )

            access_token = token_json.get('access_token')
            refresh_token = token_json.get('refresh_token', '')
            access_token_expires_in = token_json.get('expires_in')
            refresh_token_expires_in = token_json.get('refresh_token_expires_in', 604800)
            access_token_expires_at = int(time.time()) + access_token_expires_in
            refresh_token_expires_at = int(time.time()) + refresh_token_expires_in

            response.set_cookie(
                'access_token',
                access_token,
                max_age=access_token_expires_in,
                httponly=True,
                secure=True,
                samesite='None'
            )

            if refresh_token:
                response.set_cookie(
                    'refresh_token',
                    refresh_token,
                    max_age=refresh_token_expires_in,
                    httponly=True,
                    secure=True,
                    samesite='None'
                )

            if social_account:
                if not social_account.extra_data:
                    social_account.extra_data = {}

                social_account.extra_data.update({
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'access_token_expires_at': access_token_expires_at,
                    'refresh_token_expires_at': refresh_token_expires_at,
                    'sub': google_data.get('sub'),
                    'picture': google_data.get('picture'),
                    'email': google_data.get('email'),
                    'given_name': google_data.get('given_name'),
                    'family_name': google_data.get('family_name')
                })
                social_account.save()

                try:
                    google_app = SocialApp.objects.get(provider='google')
                except SocialApp.DoesNotExist:
                    site = Site.objects.get(id=settings.SITE_ID)
                    google_app = SocialApp.objects.create(
                        provider='google',
                        name='Google',
                        client_id=settings.GOOGLE_CLIENT_ID,
                        secret=settings.GOOGLE_CLIENT_SECRET
                    )
                    google_app.sites.add(site)
                    google_app.save()
                    print("Created Google SocialApp")

                expires_at = timezone.now() + datetime.timedelta(seconds=access_token_expires_in)
                try:
                    token = SocialToken.objects.get(account=social_account)
                    token.token = access_token
                    token.token_secret = ''
                    token.expires_at = expires_at
                    if refresh_token:
                        token.token_secret = refresh_token
                    token.save()
                except SocialToken.DoesNotExist:
                    SocialToken.objects.create(
                        account=social_account,
                        app=google_app,
                        token=access_token,
                        token_secret=refresh_token or '',
                        expires_at=expires_at
                    )

            return response
        except Exception as e:
            print(f"Error in Google code login: {str(e)}")
            return JsonResponse({'error': 'Authentication failed'}, status=500)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class UserInfoView(APIView):
    # permission_classes = []

    def get(self, request):
        try:
            if not request.user.is_authenticated:
                response = JsonResponse({'error': 'Session expired, please login again'}, status=201)
                response.set_cookie('access_token', '', max_age=0, expires='Thu, 01 Jan 1970 00:00:00 GMT',
                                    path='/', httponly=True, secure=True, samesite='None')
                response.set_cookie('refresh_token', '', max_age=0, expires='Thu, 01 Jan 1970 00:00:00 GMT',
                                    path='/', httponly=True, secure=True, samesite='None')
                response.set_cookie('sessionid', '', max_age=0, expires='Thu, 01 Jan 1970 00:00:00 GMT',
                                    path='/', httponly=True, secure=True, samesite='None')
                return Response({'is_authenticated': False})

            access_token = request.COOKIES.get('access_token')

            if not access_token:
                access_token = self._refresh_access_token(request)
                if not access_token:
                    return JsonResponse({'error': 'Tokens are missing, please login again'},
                                        status=status.HTTP_401_UNAUTHORIZED)

                response = Response({'is_authenticated': True, 'access_token': access_token})
                response.set_cookie('access_token', access_token, max_age=3600, httponly=True, secure=True,
                                    samesite='None')
            else:
                session = requests.Session()
                url = f"https://oauth2.googleapis.com/tokeninfo?access_token={access_token}"
                response = session.get(url)

                if response.status_code != 200:
                    response = JsonResponse({'error': 'Failed to validate access token'}, status=401)
                    response.set_cookie('access_token', '', max_age=0, expires='Thu, 01 Jan 1970 00:00:00 GMT',
                                        path='/', httponly=True, secure=True, samesite='None')
                    response.set_cookie('refresh_token', '', max_age=0, expires='Thu, 01 Jan 1970 00:00:00 GMT',
                                        path='/', httponly=True, secure=True, samesite='None')
                    response.set_cookie('sessionid', '', max_age=0, expires='Thu, 01 Jan 1970 00:00:00 GMT',
                                        path='/', httponly=True, secure=True, samesite='None')
                    return response

                response = Response({'is_authenticated': True})

            user_data = self._get_user_data(request.user)

            response.data = user_data
            return response

        except Exception as e:
            print(f"Error retrieving user info: {str(e)}")
            return Response({'error': 'Failed to retrieve user information'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @staticmethod
    def _refresh_access_token(request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return None

        token_url = 'https://oauth2.googleapis.com/token'
        token_data = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token',
            'redirect_uri': 'postmessage',
        }

        try:
            token_response = requests.post(token_url, data=token_data)
            if token_response.status_code == 200:
                return token_response.json().get('access_token')
            else:
                return None
        except Exception as e:
            print(f"Error refreshing access token: {str(e)}")
            return None

    @staticmethod
    def _get_user_data(user):
        social_account = user.socialaccount_set.filter(provider='google').first()

        google_id = social_account.uid if social_account else None
        profile_picture = social_account.extra_data.get('picture') if social_account else None

        return {
            'id': user.id,
            'is_authenticated': True,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'google_id': google_id,
            'profile_picture': profile_picture
        }


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(require_http_methods(["POST"]), name='dispatch')
class LogoutView(View):
    def post(self, request):
        try:
            logout(request)
            response = JsonResponse({'success': True})
            response.delete_cookie('access_token', samesite='None')
            response.delete_cookie('refresh_token', samesite='None')
            return response
        except Exception as e:
            print(f"Error during logout: {str(e)}")
            return JsonResponse({'error': 'Logout failed'}, status=500)
