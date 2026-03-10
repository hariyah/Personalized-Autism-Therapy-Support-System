import logging
import traceback
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas import RecommendationRequest, RecommendationResponse
from app.recommendation_engine import RecommendationEngine
from app.auth import get_current_user_id

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recommend", tags=["recommendations"])
engine = RecommendationEngine()


@router.get("/materials", response_model=List[str])
async def get_available_materials():
    """Get all unique materials from the activity dataset."""
    try:
        # Load vector store to get all activities
        vector_store = engine.vector_store
        if not vector_store:
            logger.warning("Vector store not loaded, returning empty list")
            return []
        
        if not vector_store.metadata:
            logger.warning("Vector store metadata not available, returning empty list")
            return []
        
        # Extract all unique materials from activities
        all_materials = set()
        for activity in vector_store.metadata:
            materials = activity.get('materials', '')
            if isinstance(materials, str):
                # Split by comma and clean up
                material_list = [m.strip().lower() for m in materials.split(',') if m.strip()]
                all_materials.update(material_list)
            elif isinstance(materials, list):
                all_materials.update([str(m).strip().lower() for m in materials if m])
        
        # Sort and return as list (capitalize first letter for better display)
        sorted_materials = sorted([m.capitalize() for m in all_materials])
        return sorted_materials
    except Exception as e:
        logger.error(f"Error fetching materials: {type(e).__name__}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching materials: {str(e)}")


@router.post("", response_model=RecommendationResponse)
async def get_recommendations(
    request: RecommendationRequest,
    user_id: str = Depends(get_current_user_id)
):
    try:
        # Always use daily plan
        plan_request_dict = request.plan_request.model_dump()
        plan_request_dict['plan_type'] = 'daily'
        
        response = await engine.generate_recommendations(
            profile_id=request.profile_id,
            plan_request=plan_request_dict,
            user_id=user_id,
        )
        
        return response
    except ValueError as e:
        logger.error(f"ValueError in recommendations: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        logger.error(f"RuntimeError in recommendations: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in recommendations: {type(e).__name__}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendations: {type(e).__name__}: {str(e)}"
        )

