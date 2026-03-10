python=3.12.12

$ conda activate aut_env
$ conda deactivate

Install Tesseract OCR (System-Level)
pytesseract is a Python wrapper — it needs the actual Tesseract binary installed on your OS separately:

# Ubuntu/Debian (or WSL on Windows)
sudo apt-get install tesseract-ocr

# Windows — download installer from:
# https://github.com/UB-Mannheim/tesseract/wiki
# Then add to PATH, e.g.: C:\Program Files\Tesseract-OCR\

# macOS
brew install tesseract