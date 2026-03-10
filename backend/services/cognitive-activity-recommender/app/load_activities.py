"""Script to load activities from CSV into FAISS vector store."""
import sys
import os

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.vector_store import ActivityVectorStore


def load_activities():
    """Load activities from CSV and create vector store."""
    # Get the backend directory (parent of app directory)
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(backend_dir, "autism_activity_dataset_1200_advanced.csv")
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        print("Please ensure autism_activity_dataset_1200_advanced.csv is in the backend directory.")
        return
    
    # Create vector store
    vector_store = ActivityVectorStore()
    
    # Load from CSV
    vector_store.load_from_csv(csv_path)
    
    # Save to disk (saves in backend directory)
    os.chdir(backend_dir)  # Change to backend directory for saving
    vector_store.save()
    
    print("Activities loaded successfully!")
    print(f"Total activities: {len(vector_store.metadata)}")
    print(f"Index saved to: {os.path.join(backend_dir, vector_store.index_path)}")
    print(f"Metadata saved to: {os.path.join(backend_dir, vector_store.metadata_path)}")


if __name__ == "__main__":
    load_activities()

