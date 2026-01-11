# Autism AI-Powered Cognitive Activity Recommender

A production-ready web application that recommends personalized cognitive activities for children with Autism Spectrum Disorder (ASD) based on child profiles, preferences, recent behavior, and past activity outcomes.

## ⚠️ Important Safety Notice

**This application is NOT for diagnosis or medical advice.** It is a tool to assist therapists and parents in selecting appropriate cognitive activities. Always consult with qualified healthcare professionals for medical decisions.

## Features

- **Child Profile Management**: Create and manage detailed child profiles with communication level, cognitive level, sensory sensitivities, interests, triggers, and goals
- **Activity Library**: Comprehensive library of cognitive activities with detailed metadata (materials, steps, difficulty, sensory load, safety notes)
- **AI-Powered Recommendations**: Get personalized activity recommendations based on:
  - Child profile and preferences
  - Today's context (mood, attention level, environment)
  - Recent activity outcomes and feedback
- **Safety Constraints**: Automatic filtering to avoid activities that could trigger sensory overload or other concerns
- **Feedback Loop**: Log activity outcomes (engagement, stress, success) to improve future recommendations
- **Flexible LLM Integration**: Support for OpenAI API or local LLaMA models via provider pattern

## Tech Stack

### Backend
- **FastAPI** (Python) - REST API
- **MongoDB** - Database
- **Pydantic** - Data validation
- **Motor** - Async MongoDB driver
- **OpenAI API** or **Local LLaMA** - LLM integration

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **React Router** - Navigation

## Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB (local or remote)
- OpenAI API key (if using OpenAI provider) OR local LLaMA endpoint (if using local provider)

## Installation & Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env file with your settings:
# - MONGODB_URI (default: mongodb://localhost:27017)
# - MONGODB_DB_NAME (default: cognitive_plan)
# - LLM_PROVIDER (openai or ollama) - default: ollama
# - OLLAMA_ENDPOINT (default: http://localhost:11434/api/chat)
# - OLLAMA_MODEL (default: llama3.1)
# - OPENAI_API_KEY (only if using OpenAI)
# - JWT_SECRET_KEY (change in production)
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file (optional, defaults to http://localhost:8000)
echo "VITE_API_URL=http://localhost:8000" > .env
```

### 3. Database Setup

Make sure MongoDB is running:

```bash
# If using local MongoDB, start it:
# On Windows (if installed as service, it should auto-start)
# On macOS with Homebrew:
brew services start mongodb-community
# On Linux:
sudo systemctl start mongod
```

### 4. Seed Sample Data

```bash
# From backend directory, with virtual environment activated
python run_seed.py
```

This will populate the database with 17 sample activities across different categories.

## Running the Application

### Start Backend

```bash
# From backend directory, with virtual environment activated
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI): `http://localhost:8000/docs`

### Start Frontend

```bash
# From frontend directory
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage Guide

### 1. Create a Child Profile

1. Navigate to the Dashboard
2. Click "Create New Profile"
3. Fill in:
   - Name and age
   - Communication level (nonverbal/limited/verbal)
   - Cognitive level (low/medium/high)
   - Sensory sensitivities (sound/light/touch: low/med/high)
   - Interests (tags)
   - Triggers (tags to avoid)
   - Goals (attention/memory/social/motor/emotion)

### 2. Get Recommendations

1. Click on a profile from the Dashboard
2. Fill in "Get Recommendations" form:
   - Current mood
   - Attention level
   - Environment
3. Click "Get Recommendations"
4. Review the top 5 recommended activities with:
   - Reason for recommendation
   - Difficulty adaptations
   - Step-by-step instructions
   - Sensory-safe variants
   - Expected benefits
   - Success checklist

### 3. Log Activity Outcomes

1. After trying a recommended activity, click "Log Activity Outcome"
2. Rate:
   - Engagement (1-5)
   - Stress level (1-5)
   - Success (1-5)
3. Add optional notes
4. Submit

This feedback will be used to improve future recommendations.

### 4. Browse Activity Library

Navigate to "Activity Library" to view all available activities, filter by category, and see detailed information.

## API Endpoints

### Profiles
- `GET /profiles` - List all profiles
- `GET /profiles/{id}` - Get profile by ID
- `POST /profiles` - Create profile
- `PUT /profiles/{id}` - Update profile
- `DELETE /profiles/{id}` - Delete profile

### Activities
- `GET /activities` - List all activities
- `GET /activities/{id}` - Get activity by ID
- `POST /activities` - Create activity
- `PUT /activities/{id}` - Update activity
- `DELETE /activities/{id}` - Delete activity

### Recommendations
- `POST /recommend` - Get activity recommendations
  ```json
  {
    "profile_id": "string",
    "today_context": {
      "mood": "calm|anxious|energetic|tired|focused|distracted",
      "attention_level": "low|medium|high",
      "environment": "home|therapy|school|outdoor"
    }
  }
  ```

### Outcomes
- `GET /outcomes?profile_id={id}&activity_id={id}` - List outcomes
- `POST /outcomes` - Create outcome
- `GET /outcomes/{id}` - Get outcome by ID

## LLM Provider Configuration

### Using Ollama (Default - Recommended)

1. Install Ollama from https://ollama.ai
2. Pull a small model (3B recommended for most systems):
   ```bash
   ollama pull llama3.2:3b
   ```
   For systems with more GPU memory, you can use a larger model:
   ```bash
   ollama pull llama3.1:8b
   ```
3. Start Ollama (usually runs automatically as a service)
4. Set in `.env` (or use defaults):
   ```
   LLM_PROVIDER=ollama
   OLLAMA_ENDPOINT=http://localhost:11434/api/chat
   OLLAMA_MODEL=llama3.2:3b
   ```
5. The system will use Ollama's chat API for recommendations

**Note:** The default is `llama3.2:3b` (3B model) which works on most systems. If you encounter "out of memory" errors, try CPU mode: `set OLLAMA_NUM_GPU=0` before starting Ollama.

### Using OpenAI

1. Set `LLM_PROVIDER=openai` in `.env`
2. Set `OPENAI_API_KEY=your_key_here` in `.env`
3. The system will use GPT-4 Turbo for recommendations

## Project Structure

```
cognitive_plan/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Configuration
│   │   ├── database.py           # MongoDB connection
│   │   ├── schemas.py            # Pydantic models
│   │   ├── llm_providers.py     # LLM provider pattern
│   │   ├── recommendation_engine.py  # Recommendation logic
│   │   ├── seed_data.py         # Sample activities
│   │   └── routers/
│   │       ├── profiles.py
│   │       ├── activities.py
│   │       ├── recommendations.py
│   │       └── outcomes.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts         # Type-safe API client
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── ProfileModal.tsx
│   │   │   ├── RecommendationCard.tsx
│   │   │   ├── RecommendationForm.tsx
│   │   │   └── OutcomeModal.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ProfileDetail.tsx
│   │   │   └── ActivityLibrary.tsx
│   │   ├── types.ts              # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Safety Features

- **Sensory Filtering**: Automatically filters out activities with high sensory load if child has high sensitivity
- **Trigger Avoidance**: Excludes activities containing known triggers
- **Age Appropriateness**: Validates activities match child's age
- **Safety Notes**: All activities include safety considerations
- **No Medical Claims**: LLM prompts explicitly prohibit medical advice
- **Therapist-Friendly Language**: All recommendations use clear, professional language

## Troubleshooting

### Backend Issues

- **MongoDB Connection Error**: Ensure MongoDB is running and `MONGODB_URI` is correct
- **LLM Provider Error**: Check API key (OpenAI) or endpoint (local LLM) configuration
- **Import Errors**: Ensure virtual environment is activated and dependencies are installed

### Frontend Issues

- **API Connection Error**: Check that backend is running on port 8000, or update `VITE_API_URL`
- **Build Errors**: Run `npm install` again, check Node.js version (18+)

### Recommendation Issues

- **No Recommendations**: Ensure activities are seeded, check LLM provider configuration
- **JSON Parse Errors**: LLM response may be malformed; system includes fallback recommendations

## Development

### Running Tests (Future)

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality

- Backend: Follow PEP 8, use type hints
- Frontend: Follow ESLint rules, use TypeScript strictly

## License

This project is for educational and therapeutic use. Please ensure compliance with healthcare regulations in your jurisdiction.

## Contributing

When contributing:
1. Maintain safety constraints
2. Keep therapist/parent-friendly language
3. Add appropriate validation
4. Update documentation

## Support

For issues or questions, please review the troubleshooting section or check the API documentation at `/docs` when the backend is running.

---

**Remember**: This tool is designed to assist, not replace, professional therapy and medical advice. Always consult qualified professionals for healthcare decisions.

