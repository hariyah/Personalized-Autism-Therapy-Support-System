# RAG (Retrieval Augmented Generation) Setup Guide

## Overview

The recommendation system now uses RAG with FAISS vector search for semantic activity recommendations. Activities are loaded from the CSV dataset and stored in a FAISS vector database for fast semantic search.

## Setup Steps

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install:
- `sentence-transformers` - For creating embeddings
- `faiss-cpu` - For vector similarity search
- `pandas` - For CSV processing
- `numpy` - For numerical operations

### 2. Load Activities into Vector Store

Run the script to load activities from CSV into FAISS:

```bash
cd backend
python load_activities.py
```

This will:
- Read `autism_activity_dataset_1200_advanced.csv`
- Create embeddings for all activities using sentence-transformers
- Build a FAISS index for fast similarity search
- Save the index to `activity_index.faiss` and metadata to `activity_metadata.pkl`

**Note:** The first run will download the embedding model (~80MB), which may take a few minutes.

### 3. Verify Vector Store

The script will create:
- `activity_index.faiss` - FAISS vector index
- `activity_metadata.pkl` - Activity metadata

The vector store will automatically load these files when the recommendation engine starts.

## How It Works

### Semantic Search Process

1. **Query Building**: The system builds a semantic query from:
   - Child profile (goals, interests, cognitive level, communication level)
   - Today's context (mood, attention level, environment)
   - Recent activity outcomes

2. **Vector Search**: 
   - Query is embedded using the same model
   - FAISS performs fast similarity search
   - Returns top 20 candidate activities

3. **Filtering**:
   - Applies safety filters (age, sensory sensitivity, triggers)
   - Refines to top 10 activities

4. **LLM Enhancement**:
   - Top activities sent to LLM with profile context
   - LLM generates personalized recommendations with:
     - Reason for recommendation
     - Difficulty adaptations
     - Step-by-step instructions
     - Sensory-safe variants
     - Expected benefits
     - Success checklist

### Activity Data Format

Activities from CSV include:
- `activity_name` - Name of the activity
- `domain` - Category (Writing, Gross Motor, Speech, Sensory, etc.)
- `difficulty` - Easy, Moderate, Challenging
- `goal` - Primary goal of the activity
- `skills_targeted` - Skills developed
- `materials` - Required materials
- `time_required_minutes` - Duration
- `step_instructions` - Detailed instructions
- `age_range` - Suitable age range
- `sensory_suitability` - Sensory considerations
- `autism_level_suitability` - Support level needed
- `environment_fit` - Best environment
- `cost_level` - Cost estimate
- `learning_style_fit` - Learning style preference

## Troubleshooting

### Vector Store Not Found

If you see "Vector store not found" error:
1. Make sure you've run `python load_activities.py`
2. Check that `activity_index.faiss` and `activity_metadata.pkl` exist in the backend directory
3. Ensure you have write permissions in the backend directory

### Slow First Load

The first time loading activities will be slow because:
- The embedding model needs to be downloaded
- Creating embeddings for 1200 activities takes time (~2-5 minutes)

Subsequent loads are fast as the index is saved to disk.

### Memory Usage

FAISS index and embeddings use memory:
- Index: ~2-5 MB
- Embeddings: ~2-5 MB
- Model: ~80 MB (loaded once)

Total: ~90-100 MB additional memory usage.

## Updating Activities

To update activities from a new CSV:
1. Replace `autism_activity_dataset_1200_advanced.csv`
2. Delete `activity_index.faiss` and `activity_metadata.pkl`
3. Run `python load_activities.py` again

## Performance

- **Search Speed**: < 50ms for semantic search
- **Recommendation Generation**: 2-5 seconds (depends on LLM provider)
- **Index Size**: ~2-5 MB on disk
- **Load Time**: < 1 second (after initial creation)

