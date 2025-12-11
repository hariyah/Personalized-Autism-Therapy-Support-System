import os
import argparse
import shutil
from pathlib import Path
import random

LABELS = ["Natural","joy","fear","anger","sadness","surprise"]

def gather_images(src_dir):
    items = []
    for label in LABELS:
        label_dir = Path(src_dir) / label
        if label_dir.exists():
            for p in label_dir.rglob('*'):
                if p.is_file() and p.suffix.lower() in {'.jpg','.jpeg','.png','.bmp','.gif'}:
                    items.append((p, label))
    return items

def split_and_copy(items, out_dir, train_ratio=0.8, val_ratio=0.1, seed=42):
    random.seed(seed)
    by_label = {label: [] for label in LABELS}
    for p,label in items:
        by_label[label].append(p)
    for label, paths in by_label.items():
        random.shuffle(paths)
        n = len(paths)
        n_train = int(n * train_ratio)
        n_val = int(n * val_ratio)
        splits = {
            'train': paths[:n_train],
            'val': paths[n_train:n_train+n_val],
            'test': paths[n_train+n_val:]
        }
        for split, lst in splits.items():
            dest = Path(out_dir) / split / label
            dest.mkdir(parents=True, exist_ok=True)
            for src in lst:
                shutil.copy2(src, dest / src.name)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True, help='Path to source dataset root containing label folders')
    ap.add_argument('--output', required=True, help='Output dataset root with train/val/test splits')
    ap.add_argument('--train', type=float, default=0.8)
    ap.add_argument('--val', type=float, default=0.1)
    ap.add_argument('--seed', type=int, default=42)
    args = ap.parse_args()

    items = gather_images(args.input)
    if not items:
        raise SystemExit('No images found in input dataset. Ensure folders for labels exist: ' + ', '.join(LABELS))
    split_and_copy(items, args.output, train_ratio=args.train, val_ratio=args.val, seed=args.seed)
    print('Prepared dataset at', args.output)

if __name__ == '__main__':
    main()
