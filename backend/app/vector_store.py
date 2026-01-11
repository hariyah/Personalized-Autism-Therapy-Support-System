"""Vector store for activity recommendations using FAISS."""
import os
import pickle
import logging
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Tuple
import pandas as pd

logger = logging.getLogger(__name__)


class ActivityVectorStore:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2", index_path: str = "activity_index.faiss", metadata_path: str = "activity_metadata.pkl"):
        try:
            self.model = SentenceTransformer(model_name)
        except Exception as e:
            logger.error(f"Error loading SentenceTransformer model: {str(e)}")
            raise
        
        # Use absolute paths relative to backend directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.index_path = os.path.join(backend_dir, index_path) if not os.path.isabs(index_path) else index_path
        self.metadata_path = os.path.join(backend_dir, metadata_path) if not os.path.isabs(metadata_path) else metadata_path
        
        self.index = None
        self.metadata = []
        self.dimension = 384  # Dimension for all-MiniLM-L6-v2
        
    def _create_text_representation(self, activity: Dict[str, Any]) -> str:
        """Create a text representation of an activity for embedding."""
        parts = [
            f"Activity: {activity.get('activity_name', '')}",
            f"Domain: {activity.get('domain', '')}",
            f"Difficulty: {activity.get('difficulty', '')}",
            f"Goal: {activity.get('goal', '')}",
            f"Skills: {activity.get('skills_targeted', '')}",
            f"Materials: {activity.get('materials', '')}",
            f"Age range: {activity.get('age_range', '')}",
            f"Sensory suitability: {activity.get('sensory_suitability', '')}",
            f"Autism level: {activity.get('autism_level_suitability', '')}",
            f"Environment: {activity.get('environment_fit', '')}",
            f"Learning style: {activity.get('learning_style_fit', '')}",
            f"Instructions: {activity.get('step_instructions', '')}",
        ]
        return " | ".join(parts)
    
    def load_from_csv(self, csv_path: str):
        """Load activities from CSV and create vector index."""
        print(f"Loading activities from {csv_path}...")
        df = pd.read_csv(csv_path)
        
        # Convert DataFrame to list of dicts
        activities = df.to_dict('records')
        
        # Create text representations and embeddings
        texts = [self._create_text_representation(act) for act in activities]
        print(f"Creating embeddings for {len(texts)} activities...")
        embeddings = self.model.encode(texts, show_progress_bar=True)
        
        # Create FAISS index
        self.dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(self.dimension)
        
        # Normalize embeddings for cosine similarity (using L2)
        faiss.normalize_L2(embeddings)
        self.index.add(embeddings.astype('float32'))
        
        # Store metadata
        self.metadata = activities
        
        print(f"Created index with {self.index.ntotal} vectors")
    
    def save(self):
        """Save the index and metadata to disk."""
        if self.index is not None:
            faiss.write_index(self.index, self.index_path)
            with open(self.metadata_path, 'wb') as f:
                pickle.dump(self.metadata, f)
            print(f"Saved index to {self.index_path} and metadata to {self.metadata_path}")
    
    def load(self):
        """Load the index and metadata from disk."""
        if not os.path.exists(self.index_path):
            logger.warning(f"Index file not found: {self.index_path}")
            return False
        
        if not os.path.exists(self.metadata_path):
            logger.warning(f"Metadata file not found: {self.metadata_path}")
            return False
        
        try:
            self.index = faiss.read_index(self.index_path)
            with open(self.metadata_path, 'rb') as f:
                self.metadata = pickle.load(f)
            logger.info(f"Successfully loaded vector store: {len(self.metadata)} activities, {self.index.ntotal} vectors")
            return True
        except Exception as e:
            logger.error(f"Error loading vector store: {type(e).__name__}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise
    
    def search(self, query: str, k: int = 10, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Search for similar activities using semantic search."""
        if self.index is None or len(self.metadata) == 0:
            logger.warning("Vector store is empty or not loaded")
            return []
        
        try:
            # Create query embedding
            query_embedding = self.model.encode([query])
            faiss.normalize_L2(query_embedding)
            query_embedding = query_embedding.astype('float32')
            
            # Search
            search_k = min(k * 2, self.index.ntotal)
            distances, indices = self.index.search(query_embedding, search_k)
            
            # Get results and apply filters
            results = []
            for i, idx in enumerate(indices[0]):
                if idx < len(self.metadata):
                    activity = self.metadata[idx].copy()
                    activity['similarity_score'] = float(1 - distances[0][i])  # Convert distance to similarity
                    
                    # Apply filters if provided
                    if filters:
                        if self._matches_filters(activity, filters):
                            results.append(activity)
                    else:
                        results.append(activity)
                    
                    if len(results) >= k:
                        break
            
            return results
        except Exception as e:
            logger.error(f"Error during search: {type(e).__name__}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise
    
    def _matches_filters(self, activity: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """Check if activity matches the provided filters."""
        # Age filter
        if 'age' in filters:
            age = filters['age']
            age_range = activity.get('age_range', '')
            if age_range and '-' in age_range:
                try:
                    min_age, max_age = map(int, age_range.split('-'))
                    if not (min_age <= age <= max_age):
                        return False
                except:
                    pass
        
        # Sensory filter
        if 'sensory_sensitivity' in filters:
            child_sensory = filters['sensory_sensitivity']
            activity_sensory = activity.get('sensory_suitability', '').lower()
            
            # If child has high sensitivity, avoid sensory-seeking activities
            if any(level == 'high' for level in child_sensory.values()):
                if 'sensory-seeking' in activity_sensory:
                    return False
        
        # Autism level filter - match with CSV autism_level_suitability
        if 'autism_level' in filters:
            autism_level = filters['autism_level']
            activity_level = activity.get('autism_level_suitability', '')
            
            if autism_level:
                # Direct matching: profile has "Level 1", "Level 2", or "Level 3", CSV has "Level 1 (mild support)", etc.
                if autism_level not in activity_level:
                    return False
        
        return True

