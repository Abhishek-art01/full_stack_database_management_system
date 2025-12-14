import json
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
import calendar

@csrf_exempt  # Allows React to send POST requests without a complex token (for now)
def login_api(request):
    if request.method == 'POST':
        try:
            # 1. Decode the data sent by React
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')

            # 2. Check the Database
            user = authenticate(username=username, password=password)

            if user is not None:
                login(request, user)
                return JsonResponse({'success': True, 'message': 'Welcome Back!', 'username': user.username})
            else:
                return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=401)

        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    
    return JsonResponse({'success': False, 'message': 'Only POST allowed'}, status=405)


