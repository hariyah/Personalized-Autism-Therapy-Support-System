import os
from collections import Counter

def count_files(path):
    counts = Counter()
    for root, dirs, files in os.walk(path):
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                label = os.path.basename(root)
                counts[label] += 1
    return counts

root = 'dataset'
img_root = None
for r, dirs, files in os.walk(root):
    if 'train' in dirs and 'test' in dirs:
        img_root = r
        break
if img_root is None:
    print('Dataset train/test structure not found under dataset/')
else:
    train_dir = os.path.join(img_root, 'train')
    counts = count_files(train_dir)
    print('Train class counts:')
    for k, v in counts.most_common():
        print(f'  {k}: {v}')
