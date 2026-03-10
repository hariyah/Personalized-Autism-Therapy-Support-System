# Common auth (autism-profile)

All backend services use the **same login/auth** as the autism-profile flow: **guardians** in MongoDB, JWT issued by **autism-profile-builder**.

## How it works

1. **Login/register** exist only in **autism-profile-builder** (`/api/auth/login`, `/api/auth/register`). It uses MongoDB collection `guardians` (email, password_hash, fullName, phone, relationship) and issues a JWT with payload `{ "id": guardian_id, "email": email }`.

2. **Gateway** exposes common auth at **`/api/auth`** and proxies to profile-builder. Frontends should call:
   - `POST <gateway>/api/auth/register`
   - `POST <gateway>/api/auth/login`
   So one login works for all services behind the gateway.

3. **Other services** (e.g. cognitive-activity-recommender) **do not** implement login/register. They only **verify** the JWT using the **same SECRET_KEY** as profile-builder. Protected routes require `Authorization: Bearer <token>` and use the decoded `id` (guardian_id) from the token.

## Env: same SECRET_KEY

- **autism-profile-builder**: `SECRET_KEY` (used to sign JWT).
- **cognitive-activity-recommender** (and any service that verifies the token): set **`SECRET_KEY`** (or `AUTH_SECRET_KEY`) to the **same value** as profile-builder so tokens are valid everywhere.

Example (same value in both services’ `.env`):

```env
SECRET_KEY=dev-secret-change-in-production
```

## Summary

| Service                 | Role                    | Auth endpoints        |
|------------------------|-------------------------|------------------------|
| Gateway                | Proxies `/api/auth`     | → profile-builder      |
| autism-profile-builder | Login, register, JWT   | `/api/auth/login`, `/api/auth/register` |
| cognitive-activity-recommender | Verify JWT only | `/auth/me` (returns user from token)    |
