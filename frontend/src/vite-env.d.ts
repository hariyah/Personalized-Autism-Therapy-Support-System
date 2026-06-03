/// <reference types="vite/client" />

/** Vite-injected env; set values in `.env` (see `.env.example`). */
interface ImportMetaEnv {
  /** Profile-builder (Flask): /api/auth/*, /api/patients, … Default http://localhost:7001; gateway http://localhost:7000 */
  readonly VITE_PROFILE_API_URL?: string;
  /** Cognitive recommender (FastAPI). Default http://localhost:7002; gateway http://localhost:7000/cognitive */
  readonly VITE_COGNITIVE_API_URL?: string;
  /** Therapy collab (Express). Default http://localhost:7005; gateway http://localhost:7000/therapy */
  readonly VITE_THERAPY_API_URL?: string;
  /** Emotional / Autism Care API base (…/children, …/activities). Default http://localhost:7003/api; gateway http://localhost:7000/emotional/api */
  readonly VITE_EMOTIONAL_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
