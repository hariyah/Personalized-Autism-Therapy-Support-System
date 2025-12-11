import os
import glob
import requests

root = os.path.join(os.path.dirname(__file__), 'dataset')
imgs = glob.glob(os.path.join(root, '**', '*.*'), recursive=True)
imgs = [p for p in imgs if p.lower().endswith(('.jpg','.jpeg','.png'))]
if not imgs:
    print('No image found under', root)
    raise SystemExit(1)

img = imgs[0]
print('Using image:', img)
url = 'http://localhost:3001/api/predict-emotion'
try:
    with open(img, 'rb') as f:
        files = {'image': ('test.jpg', f, 'image/jpeg')}
        r = requests.post(url, files=files, timeout=30)
    print('Status:', r.status_code)
    try:
        print('Response JSON:', r.json())
    except Exception:
        print('Response text:', r.text)
except Exception as e:
    print('Request error:', repr(e))
    raise
