from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
import requests
from datetime import datetime, date
import calendar


class CalendarEventListView(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)

        try:
            access_token = request.COOKIES.get('access_token')
            calendar_id = 'primary'

            year = request.query_params.get('year')
            month = request.query_params.get('month')

            if year and month:
                year = int(year)
                month = int(month)
            else:
                today = datetime.today()
                year = today.year
                month = today.month

            first_day = date(year, month, 1)
            last_day_of_month = calendar.monthrange(year, month)[1]
            last_day = date(year, month, last_day_of_month)

            time_min = datetime.combine(first_day, datetime.min.time()).isoformat() + 'Z'
            time_max = datetime.combine(last_day, datetime.max.time()).isoformat() + 'Z'

            url = f'https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events'
            params = {
                'timeMin': time_min,
                'timeMax': time_max,
                'singleEvents': True,
                'orderBy': 'startTime'
            }
            headers = {
                'Authorization': f'Bearer {access_token}'
            }

            response = requests.get(url, params=params, headers=headers)

            if response.status_code == 200:
                calendar_data = response.json()
                events = calendar_data.get('items', [])

                formatted_events = []
                for event in events:
                    event_data = {
                        'id': event.get('id'),
                        'summary': event.get('summary'),
                        'description': event.get('description'),
                        'location': event.get('location'),
                        'start': event.get('start'),
                        'end': event.get('end'),
                        'status': event.get('status'),
                        'htmlLink': event.get('htmlLink'),
                        'creator': event.get('creator')
                    }
                    formatted_events.append(event_data)

                return Response({
                    'events': formatted_events,
                    'period': {
                        'year': year,
                        'month': month,
                        'start': time_min,
                        'end': time_max
                    }
                })
            else:
                return Response({'error': f'Failed to fetch calendar events: {response.text}'},
                                status=response.status_code)
        except Exception as e:
            return Response({'error': 'Failed to fetch calendar events'}, status=500)


class CalendarAddAutoEventView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)

        access_token = request.COOKIES.get('access_token')

        if not access_token:
            return Response({'error': 'Missing access token'}, status=401)

        try:
            calendar_id = 'primary'
            event_data = request.data

            url = f'https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events'
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            response = requests.post(url, json=event_data, headers=headers, timeout=5)
            print(response.text)
            if response.status_code == 200:
                return Response({'message': 'Event added successfully'})
            else:
                return Response({'error': f'Failed to add event: {response.text}'}, status=response.status_code)

        except Exception as e:
            return Response({'error': 'Failed to add event'}, status=500)
