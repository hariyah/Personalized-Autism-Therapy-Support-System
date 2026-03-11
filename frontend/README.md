# Personalized Autism Therapy Support Frontend

The frontend remains a React app, but the active feature code now lives under:

- `src/pages/therapy-collab/App.js`
- `src/pages/therapy-collab/components/`
- `src/pages/therapy-collab/contexts/`
- `src/pages/therapy-collab/pages/`
- `src/pages/therapy-collab/utils/`

Root entry files:

- `src/index.js`
- `src/index.css`
- `src/App.js`

## Development

```powershell
cd frontend
npm install
npm start
```

The frontend runs on `http://localhost:3000` and proxies API traffic to the gateway on `http://localhost:5000`.

## Build

```powershell
npm run build
```
