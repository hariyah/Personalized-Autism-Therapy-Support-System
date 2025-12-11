from kaggle.api.kaggle_api_extended import KaggleApi
import os, traceback
ml_path = r"c:\Users\avi\OneDrive - Sri Lanka Institute of Information Technology\Desktop\Personalized-Autism-Therapy-Support-System\ml_service"
dest = os.path.join(ml_path, 'dataset')
try:
    print('Authenticating...')
    api = KaggleApi()
    api.authenticate()
    print('Authenticated')
    print('Downloading dataset...')
    api.dataset_download_files('fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat', path=dest, unzip=True)
    print('Download call finished')
    # list files
    for root, dirs, files in os.walk(dest):
        for f in files[:20]:
            print(os.path.join(root, f))
    count = sum(len(files) for _, _, files in os.walk(dest))
    print('Total files:', count)
except Exception as e:
    traceback.print_exc()
    print('Error:', str(e))
