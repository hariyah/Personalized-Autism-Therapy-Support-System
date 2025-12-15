import zipfile, os

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
zip_path = os.path.join(script_dir, "dataset", "autistic-children-emotions-dr-fatma-m-talaat.zip")
dest = os.path.dirname(zip_path)

if not os.path.exists(zip_path):
    print(f'ZIP_MISSING: {zip_path}')
else:
    print(f'Found zip at: {zip_path}')
    print('Extracting...')
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(dest)
    print('Extraction complete!')
    
    # List some extracted files
    count = 0
    for root, dirs, files in os.walk(dest):
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                print(os.path.join(root, f))
                count += 1
                if count > 20:
                    break
        if count > 20:
            break
    
    # Count total images
    total_images = 0
    for root, dirs, files in os.walk(dest):
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                total_images += 1
    
    print(f'\nTotal image files found: {total_images}')
