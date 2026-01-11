# Project Structure

```
cognitive_plan/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI application entry point
│   │   ├── config.py                  # Configuration and settings
│   │   ├── database.py                # MongoDB connection management
│   │   ├── schemas.py                 # Pydantic models and validation
│   │   ├── llm_providers.py           # LLM provider pattern (OpenAI/Local)
│   │   ├── recommendation_engine.py  # Core recommendation logic
│   │   ├── seed_data.py               # Sample activities data
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── profiles.py            # Child profile CRUD endpoints
│   │       ├── activities.py          # Activity library CRUD endpoints
│   │       ├── recommendations.py     # Recommendation endpoint
│   │       └── outcomes.py           # Activity outcome endpoints
│   ├── requirements.txt               # Python dependencies
│   ├── run_seed.py                    # Script to seed database
│   └── .env.example                   # Environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts              # Type-safe API client
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Navigation bar
│   │   │   ├── ProfileCard.tsx        # Profile display card
│   │   │   ├── ProfileModal.tsx       # Create/edit profile modal
│   │   │   ├── RecommendationCard.tsx # Recommendation display
│   │   │   ├── RecommendationForm.tsx # Get recommendations form
│   │   │   └── OutcomeModal.tsx      # Log outcome modal
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Main dashboard
│   │   │   ├── ProfileDetail.tsx      # Profile detail and recommendations
│   │   │   └── ActivityLibrary.tsx     # Activity library browser
│   │   ├── types.ts                   # TypeScript type definitions
│   │   ├── App.tsx                    # Main app component with routing
│   │   ├── main.tsx                   # React entry point
│   │   └── index.css                  # Global styles with Tailwind
│   ├── index.html                     # HTML template
│   ├── package.json                   # Node.js dependencies
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── tsconfig.node.json             # TypeScript config for Vite
│   ├── vite.config.ts                 # Vite build configuration
│   ├── tailwind.config.js             # Tailwind CSS configuration
│   └── postcss.config.js              # PostCSS configuration
│
├── README.md                          # Main documentation
├── QUICKSTART.md                      # Quick start guide
├── PROJECT_STRUCTURE.md               # This file
└── .gitignore                         # Git ignore rules
```

## Key Files Explained

### Backend

- **main.py**: FastAPI app initialization, CORS setup, router registration
- **config.py**: Environment variable management using Pydantic Settings
- **database.py**: MongoDB async connection using Motor
- **schemas.py**: All Pydantic models for request/response validation
- **llm_providers.py**: Abstract provider pattern for OpenAI and local LLM
- **recommendation_engine.py**: Core logic for filtering activities and generating recommendations
- **routers/**: REST API endpoints organized by resource

### Frontend

- **api/client.ts**: Centralized API client with type-safe methods
- **types.ts**: Shared TypeScript interfaces matching backend schemas
- **components/**: Reusable UI components
- **pages/**: Route-level page components
- **App.tsx**: React Router setup and main layout

## Data Flow

1. **User creates profile** → Frontend → API → MongoDB
2. **User requests recommendations** → API → Recommendation Engine → LLM Provider → Filtered results
3. **User logs outcome** → Frontend → API → MongoDB → Used in future recommendations

## Database Collections

- **profiles**: Child profiles with preferences and sensitivities
- **activities**: Activity library with metadata
- **outcomes**: Activity attempt outcomes and feedback

