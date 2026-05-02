const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:7004';
const FALLBACK_URL = 'http://localhost:5000';

function resolveSource(filename, source) {
  if (source === 'camera' || source === 'upload') {
    return source;
  }
  const name = String(filename || '').toLowerCase();
  return name === 'camera.jpg' ? 'camera' : 'upload';
}

function buildRequestBody(buffer, filename, source) {
  const formData = new (require('form-data'))();
  const defaultName = source === 'camera' ? 'camera.jpg' : 'upload.jpg';
  formData.append('file', buffer, { filename: filename || defaultName });
  const headers = { ...formData.getHeaders(), 'x-input-source': source };
  return { formData, headers };
}

function endpointForSource(source) {
  return source === 'camera' ? '/predict-camera' : '/predict';
}

async function predictEmotionFromBuffer(buffer, filename, source = 'upload') {
  const resolvedSource = resolveSource(filename, source);
  const endpoint = endpointForSource(resolvedSource);
  // Try primary URL, then fallback
  const urls = [`${ML_SERVICE_URL}${endpoint}`, `${FALLBACK_URL}${endpoint}`];
  let lastErr;

  // Up to 2 attempts per URL for transient failures
  for (const u of urls) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const { formData, headers } = buildRequestBody(buffer, filename, resolvedSource);
        const response = await axios.post(u, formData, { headers, timeout: 45000 });
        return response.data;
      } catch (err) {
        lastErr = err;
        const transient = isTransientError(err);
        if (!transient || attempt === 2) {
          break;
        }
        // small backoff before retry
        await delay(500 * attempt);
      }
    }
  }
  const msg = lastErr?.response?.data?.error || lastErr?.message || 'Unknown error contacting ML service';
  const status = lastErr?.response?.status || 503;
  const e = new Error(`ML service error (${status}): ${msg}`);
  e.status = status;
  e.detail = { tried: [ML_SERVICE_URL, FALLBACK_URL], endpoint };
  throw e;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isTransientError(err) {
  // Retry on common network/transient issues
  const code = err?.code;
  const status = err?.response?.status;
  return (
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNABORTED' ||
    code === 'EAI_AGAIN' ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

// Backward-compatible name used by index.js
async function predictEmotionFromImage(buffer, filename, source = 'upload') {
  return predictEmotionFromBuffer(buffer, filename, source);
}

async function getHealth() {
  const urls = [`${ML_SERVICE_URL}/health`, `${FALLBACK_URL}/health`];
  let lastErr;
  for (const u of urls) {
    try {
      const response = await axios.get(u, { timeout: 5000 });
      return response.data;
    } catch (err) {
      lastErr = err;
    }
  }
  const msg = lastErr?.response?.data?.error || lastErr?.message || 'Unknown error contacting ML service';
  const status = lastErr?.response?.status || 503;
  const e = new Error(`ML health check failed (${status}): ${msg}`);
  e.status = status;
  e.detail = { tried: [ML_SERVICE_URL, FALLBACK_URL], endpoint: '/health' };
  throw e;
}

async function checkMLServiceHealth() {
  try {
    const data = await getHealth();
    // Consider healthy if explicit healthy flag or any JSON returned without error
    if (data && typeof data === 'object') {
      if (Object.prototype.hasOwnProperty.call(data, 'healthy')) {
        return !!data.healthy;
      }
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

module.exports = {
  predictEmotionFromBuffer,
  predictEmotionFromImage,
  getHealth,
  checkMLServiceHealth,
};
