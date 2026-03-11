Common authentication flow for the service-oriented backend layout.

- The frontend talks only to `backend/gateway`.
- `backend/gateway` proxies `/api/*` requests to `backend/services/therapy-collab`.
- `backend/services/therapy-collab` owns JWT issuance, validation, user lookup, and role checks.
- `backend/services/therapy-collab-ai` is internal and does not issue user auth tokens.

Environment notes:

- Set `JWT_SECRET` in `backend/services/therapy-collab/.env`.
- Keep MongoDB credentials only in `backend/services/therapy-collab/.env`.
- Keep AI model paths only in `backend/services/therapy-collab-ai/.env`.

Runtime ports by default:

- Gateway: `5000`
- Therapy collab API: `5001`
- Therapy collab AI: `8000`
- Frontend: `3000`
