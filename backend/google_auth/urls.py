from django.urls import path, include
from .views import GoogleLoginView, UserInfoView, LogoutView

urlpatterns = [
    path('user-info/', UserInfoView.as_view(), name='user_info'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('login/', GoogleLoginView.as_view(), name='login'),
]
