import os
from predict_emotion import EmotionPredictor
import json

if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), 'dataset')
    # find first image
    imgs = []
    for dirpath, dirs, files in os.walk(root):
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                imgs.append(os.path.join(dirpath, f))
    if not imgs:
        print('No images found under', root)
        raise SystemExit(1)
    img = imgs[0]
    print('Using image:', img)
    p = EmotionPredictor()
    res = p.predict(img)
    print('Result:')
    print(json.dumps(res, indent=2))
