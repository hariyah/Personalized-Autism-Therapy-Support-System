import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# When running as `python main.py` from inside app/, add service root so `app` package is found
if __name__ == "__main__" or Path(__file__).resolve().parent == Path.cwd():
    _root = Path(__file__).resolve().parent.parent
    if str(_root) not in sys.path:
        sys.path.insert(0, str(_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import profiles, recommendations, outcomes, auth

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up application...")
    try:
        await connect_to_mongo()
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error("Failed to connect to MongoDB during startup (%s); API will retry on demand.", e)
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="Autism AI-Powered Cognitive Activity Recommender",
    description="API for recommending personalized cognitive activities for children with ASD",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(recommendations.router)
app.include_router(outcomes.router)


@app.get("/")
async def root():
    return {
        "message": "Autism AI-Powered Cognitive Activity Recommender API",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import os
    import uvicorn
    # Run from app/ dir: main:app; from service root: app.main:app (reload needs module string)
    app_ref = "main:app" if Path(__file__).resolve().parent == Path.cwd() else "app.main:app"
    # Reload crawls venv on Windows and can hit WinError 1450; enable only with UVICORN_RELOAD=1
    enable_reload = os.environ.get("UVICORN_RELOAD", "0").strip() == "1"
    uvicorn.run(app_ref, host="0.0.0.0", port=7002, reload=enable_reload)

