# Copilot Project Instructions

Purpose: Enable AI coding agents to work productively in this repo immediately.
Keep changes surgical, follow existing patterns, prefer enhancement over rewrite.

## Architecture Overview
- Three services: `frontend` (React SPA, port 3000), `backend` (Express API, port 3001), `ml_service` (Flask emotion API, port 5000).
- Data flow: Browser -> React (`App.js`) -> Backend REST (`/api/*`) -> Python ML (`/predict` or `/predict-base64`) for emotion -> Backend recommendation algorithm -> React renders recommendations.
- Recommendation engine lives entirely in `backend/index.js` (in‑memory lists of `activities`, `childProfiles`, plus `getRecommendations()` scoring across emotion, social, financial, autism details, interests, needs).
- Emotion inference pipeline: `frontend` uploads image -> `backend /api/predict-emotion` -> `backend/emotionService.js` -> Python `ml_service/app.py` -> `predict_emotion.py` (DenseNet‑121) -> response propagates back and may auto-update child emotion -> triggers new recommendations.

## ML Service Conventions
- Model discovery order: `ML_MODEL_PATH` env > `additional files/ml_service/BEST_MODEL_PATH.txt` > latest matching file in `ml_service/models/` with prefix `densenet121_emotion_model*` and suffix `.keras` or `.h5`.
- Training scripts: `train_model.py` (baseline two‑phase freeze/fine-tune) and `train_full.py` (face crop + optional focal loss + oversampling). After training, `BEST_MODEL_PATH.txt` is auto‑updated to absolute path.
- Predictor (`predict_emotion.py`): loads class indices from `models/class_indices.json`; applies face detection (Haar cascade) with fallback center crop; uncertain predictions flagged based on env thresholds (`EMOTION_MIN_CONF`, `EMOTION_MIN_MARGIN`).
- New eval utility: `evaluate_single_image.py` for quick manual verification; prefer before wiring model changes.

## Frontend Patterns
- Single stateful component `App.js`; no Redux. Side effects via `useEffect` for initial fetch and recommendation refresh on child change.
- API base constant: `API_BASE_URL = 'http://localhost:3001/api'`. Keep this stable; if adding versioning, mimic existing path style (`/api/<resource>`).
- Image upload flow: validate type + size (<16MB), preview via `FileReader`, send multipart to `/api/predict-emotion`; on success, auto-calls emotion update.
- Emotion labels in UI currently expect dataset classes (check `validEmotions` array). Maintain consistency with ML class indices.

## Backend Conventions
- All endpoints prefixed `/api`; avoid adding trailing slashes.
- Error responses: `{ error: <message> }` or `{ success: false, error: <message>, hint: <optional> }` for ML failures. Preserve this shape.
- File uploads handled by `multer.memoryStorage`; enforce 16MB limit and image mime/type regex. Extend types by adjusting `allowedTypes` regex only.
- ML Service health: `/api/ml-service/health` returns `{ healthy, serviceUrl }`. When adding readiness checks, reuse this style.
- Recommendation scoring: adjust weights inside `getRecommendations()`; keep factor comments and rounding pattern `Math.round(score * 100)/100`. Add new factors at the bottom with clear weight comment.

## Environment & Scripts
- Startup: `additional files/START_ALL_SERVICES.bat` sequentially (ML if model present, then backend, then frontend) + opens browser.
- ML launch (logged): `additional files/ml_service/start_service_with_env.bat` sets env thresholds; logs to `ml_service/logs/ml_service.log`.
- Training interactive: `additional files/RUN_TRAINING.bat` wraps `train_model.py`.
- For reproducible changes: update both `.h5` and `.keras` saves; ensure `BEST_MODEL_PATH.txt` points to active model.

## Adding Features Safely
- New backend resource: add data arrays or persistence layer in separate module; require it in `index.js`; keep endpoints flat under `/api`.
- Extend child model: modify `childProfiles` structure and update scoring logic; preserve existing keys for compatibility.
- Frontend additions: prefer new small components rather than expanding `App.js`; keep consistent styling classes.
- ML changes (e.g., different architecture): retain predictor interface (`predict(image_bytes) -> { emotion, confidence, all_predictions }`) to avoid cascading changes.

## Common Pitfalls
- ML service not running -> frontend shows prediction error; fix by ensuring a valid model file and starting service.
- Mismatch of emotion labels: keep class indices file synchronized with UI `validEmotions`; regenerate `class_indices.json` after retraining.
- Large image uploads >16MB rejected silently by backend error path; test with varied sizes.
- Model load failures: check `BEST_MODEL_PATH.txt` absolute path; ensure Windows path escaping not corrupted.

## Quick Verification Checklist for Agents
1. `ml_service/models/` contains a recent `.keras` or `.h5` model.
2. `additional files/ml_service/BEST_MODEL_PATH.txt` has absolute path to chosen model.
3. ML service responds: `GET http://localhost:5000/health` returns `model_loaded: true`.
4. Backend `npm start` logs activity + child counts; no uncaught errors.
5. Frontend loads counts and recommendations; image upload returns predicted emotion.

## Style & Code Practices
- Keep logging concise (emojis acceptable as already used).
- Avoid introducing global state across services; each service is independently restartable.
- Do not add unrelated dependencies—prefer standard libs (Express, Axios, TensorFlow/Keras).

Feedback welcome: clarify unclear sections before deeper refactors.
