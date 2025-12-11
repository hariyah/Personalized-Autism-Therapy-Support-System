import zipfile, os
zip_path = r"c:\Users\avi\OneDrive - Sri Lanka Institute of Information Technology\Desktop\Personalized-Autism-Therapy-Support-System\ml_service\dataset\autistic-children-emotions-dr-fatma-m-talaat.zip"
dest = os.path.dirname(zip_path)
if not os.path.exists(zip_path):
    print('ZIP_MISSING')
else:
    print('Found zip, extracting...')
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(dest)
    count = 0
    for root, dirs, files in os.walk(dest):
        for f in files:
            print(os.path.join(root, f))
            count += 1
            if count>200: break
    print('Total files listed:', count)
