import joblib
import pandas as pd

# Update path to where you downloaded the .pkl files from Drive
model = joblib.load("dsm5_severity_random_forest_model.pkl")
metadata = joblib.load("model_metadata.pkl")

print("Model loaded successfully.")
print("Expected features:", metadata["features"])
print("Severity levels:", metadata["severity_levels"])

# Test with a sample patient
sample = pd.DataFrame([{
    "A1": 1, "A2": 1, "A3": 0, "A4": 1, "A5": 1,
    "A6": 1, "A7": 0, "A8": 1, "A9": 1, "A10": 1,
    "age": 7,
    "sex": 1
}])

prediction = model.predict(sample)[0]
print("Test prediction:", metadata["severity_levels"][prediction])