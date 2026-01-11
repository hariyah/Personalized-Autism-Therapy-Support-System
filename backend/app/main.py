import logging
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

app = FastAPI(
    title="Autism AI-Powered Cognitive Activity Recommender",
    description="API for recommending personalized cognitive activities for children with ASD",
    version="1.0.0",
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


@app.on_event("startup")
async def startup_event():
    logger.info("Starting up application...")
    try:
        await connect_to_mongo()
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()


@app.get("/")
async def root():
    return {
        "message": "Autism AI-Powered Cognitive Activity Recommender API",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}

