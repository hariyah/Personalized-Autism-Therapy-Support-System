import os
import json


def find_image_directory():
    data_dir = 'dataset'
    for root, dirs, files in os.walk(data_dir):
        if 'train' in dirs and 'test' in dirs:
            return root
    if os.path.isdir(os.path.join(data_dir, 'train')):
        return data_dir
    return None


def main():
    root = find_image_directory()
    if not root:
        print('Could not find dataset. Ensure dataset with train/test is under ml_service/dataset/')
        return 1
    train_dir = os.path.join(root, 'train')
    if not os.path.isdir(train_dir):
        print('Train directory not found:', train_dir)
        return 1
    # Keras assigns class indices by sorting subdirectory names alphanumerically.
    classes = [d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))]
    classes_sorted = sorted(classes)
    reversed_map = {i: cls for i, cls in enumerate(classes_sorted)}
    os.makedirs('models', exist_ok=True)
    out_path = os.path.join('models', 'class_indices.json')
    with open(out_path, 'w') as f:
        json.dump(reversed_map, f, indent=2)
    print('Saved class indices to', out_path)
    print('Order:', reversed_map)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
