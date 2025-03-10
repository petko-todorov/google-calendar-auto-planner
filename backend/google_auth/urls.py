from django.urls import path
from .views import GoogleLoginView, UserInfoView, LogoutView

urlpatterns = [
    path('user-info/', UserInfoView.as_view(), name='user_info'),
    path('login/', GoogleLoginView.as_view(), name='google_login'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
