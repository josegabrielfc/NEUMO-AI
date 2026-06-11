import os
import numpy as np
import tensorflow as tf
from PIL import Image

# Get paths relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'neumo_ai_mobilenetv2.h5')
MEAN_PATH = os.path.join(BASE_DIR, 'neumo_ai_mean.npy')
STD_PATH = os.path.join(BASE_DIR, 'neumo_ai_std.npy')

# Global variables for caching
_model = None
_mean = None
_std = None

def load_model_and_constants():
    """Load model and normalization constants if not already loaded."""
    global _model, _mean, _std
    
    if _model is not None:
        return
        
    print("Loading AI model and normalization constants...")
    
    # Load numpy constants
    if not os.path.exists(MEAN_PATH) or not os.path.exists(STD_PATH):
        raise FileNotFoundError(f"Normalization constants not found at {MEAN_PATH} or {STD_PATH}")
    
    _mean = np.load(MEAN_PATH)
    _std = np.load(STD_PATH)
    print(f"Loaded normalization constants: Mean = {_mean}, Std = {_std}")
    
    # Load H5 model
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        
    # Load model (can take a few seconds)
    _model = tf.keras.models.load_model(MODEL_PATH)
    print("AI Model loaded successfully!")

def predict_pneumonia(image_path):
    """
    Run prediction on the given X-ray image.
    Returns:
        tuple: (result_string, confidence_percentage)
    """
    # Ensure model is loaded
    load_model_and_constants()
    
    # Open and preprocess image
    try:
        with Image.open(image_path) as img:
            # Convert to RGB (to handle grayscale, RGBA, etc.)
            img = img.convert('RGB')
            # Resize to 224x224 (required input shape)
            img = img.resize((224, 224))
            
            # Convert to numpy array of float32
            img_array = np.array(img, dtype=np.float32)
            
            # Normalize using mean and std
            img_normalized = (img_array - _mean) / _std
            
            # Add batch dimension: shape becomes (1, 224, 224, 3)
            img_batch = np.expand_dims(img_normalized, axis=0)
            
            # Run prediction
            prediction_prob = _model.predict(img_batch)[0][0]
            prediction_prob = float(prediction_prob)
            
            print(f"Model raw prediction probability: {prediction_prob:.6f}")
            
            # Interpret output: prediction_prob represents the probability of being NORMAL.
            # Decision boundary/threshold is 0.005:
            # - If prediction_prob < 0.005 -> NEUMONÍA (Low probability of being NORMAL)
            # - If prediction_prob >= 0.005 -> NORMAL (At least 0.5% probability of being NORMAL)
            if prediction_prob < 0.005:
                resultado = "NEUMONÍA"
                confianza = (1.0 - prediction_prob) * 100.0
            else:
                resultado = "NORMAL"
                confianza = prediction_prob * 100.0
                
            return resultado, round(confianza, 2)
            
    except Exception as e:
        print(f"Error during image prediction: {e}")
        raise e
