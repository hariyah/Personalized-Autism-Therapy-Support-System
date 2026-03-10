import requests
try:
    r = requests.get('http://localhost:5000/health', timeout=5)
    print('Status:', r.status_code)
    print('JSON:', r.json())
except Exception as e:
    print('Error:', e)
