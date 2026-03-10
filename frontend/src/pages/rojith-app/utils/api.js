// src/utils/api.js
const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
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
  getPatients:    (guardian_id)               => request(`/patients/${guardian_id}`),
  getAssessments: (guardian_id, patient_id)   => request(`/assessments/${guardian_id}/${patient_id}`)
};
