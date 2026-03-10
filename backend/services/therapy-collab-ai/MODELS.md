# Therapy Collab AI – Local models

Expected layout under `models/`:

- **Summarization (T5)**  
  `models/summarization_t5/checkpoints/checkpoint-875/`  
  Must contain: `config.json`, tokenizer files, **and** one of:
  - `pytorch_model.bin`, or  
  - `model.safetensors`  
  If the weights file is missing, the service falls back to the hub model (facebook/bart-large-cnn).

- **Issue classifier**  
  `models/issue_classifier_roberta/`  
  Full Hugging Face model (config + tokenizer + weights).

- **Urgency classifier**  
  `models/urgency_classifier/checkpoints/checkpoint-876/`  
  Full Hugging Face model (config + tokenizer + weights).

- **Emotion**  
  `models/emotion_recognition/densenet121.keras`  
  Requires TensorFlow. If you see `No module named 'tensorflow.python'`, use a clean venv and reinstall:

  ```bash
  cd backend\services\therapy-collab-ai
  python -m venv .venv
  .venv\Scripts\activate
  pip install -r requirements.txt
  ```
  Then run the app with this venv’s Python.
