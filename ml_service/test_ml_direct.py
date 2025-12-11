import os, glob, requests
root = os.path.join(os.path.dirname(__file__), 'dataset')
imgs = glob.glob(os.path.join(root, '**', '*.*'), recursive=True)
imgs = [p for p in imgs if p.lower().endswith(('.jpg','.jpeg','.png'))]
if not imgs:
    print('No image found')
    raise SystemExit(1)
img = imgs[0]
print('Using image:', img)
url = 'http://localhost:5000/predict'
try:
    with open(img,'rb') as f:
        files={'image':('test.jpg',f,'image/jpeg')}
        r = requests.post(url, files=files, timeout=30)
    print('Status:', r.status_code)
    try:
        print('JSON:', r.json())
    except Exception:
        print('Text:', r.text)
except Exception as e:
    print('Error:', e)
    raise
