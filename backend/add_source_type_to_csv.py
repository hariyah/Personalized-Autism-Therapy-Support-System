"""Script to add source_type column to CSV dataset."""
import pandas as pd
import os

def add_source_type_column():
    """Add source_type column to CSV, defaulting to 'synthetic'."""
    csv_path = os.path.join(os.path.dirname(__file__), "autism_activity_dataset_1200_advanced.csv")
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return
    
    print(f"Reading CSV from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Add source_type column if it doesn't exist
    if 'source_type' not in df.columns:
        df['source_type'] = 'synthetic'
        print("Added 'source_type' column with default value 'synthetic'")
    else:
        print("'source_type' column already exists")
        # Fill any NaN values with 'synthetic'
        df['source_type'] = df['source_type'].fillna('synthetic')
    
    # Save back to CSV
    backup_path = csv_path.replace('.csv', '_backup.csv')
    if not os.path.exists(backup_path):
        print(f"Creating backup at {backup_path}...")
        pd.read_csv(csv_path).to_csv(backup_path, index=False)
    
    df.to_csv(csv_path, index=False)
    print(f"Updated CSV saved. Total rows: {len(df)}")
    print(f"Source type distribution:\n{df['source_type'].value_counts()}")

if __name__ == "__main__":
    add_source_type_column()

