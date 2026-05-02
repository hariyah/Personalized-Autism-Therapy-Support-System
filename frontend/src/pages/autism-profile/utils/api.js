export const API_BASE = "/api";
const AUTH_TOKEN_KEY = "auth_token";

function getAuthHeaders() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  health:         ()                          => request("/health"),
  ocr:            (image_b64)                 => request("/ocr",  { method: "POST", body: JSON.stringify({ image_b64 }) }),
  predict:        (payload)                   => request("/predict", { method: "POST", body: JSON.stringify(payload) }),
  createPatient:  (payload)                   => request("/patients", { method: "POST", body: JSON.stringify(payload) }),
  getPatients:    (guardian_id)                => request(`/patients/${guardian_id}`),
  getAssessments: (guardian_id, patient_id)    => request(`/assessments/${guardian_id}/${patient_id}`),
};
