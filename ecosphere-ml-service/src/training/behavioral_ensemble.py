# behavioral_ensemble.py
"""
WeightedEnsemble class that can be properly pickled and unpickled
Save this file in your project directory
"""

import numpy as np

class WeightedEnsemble:
    """Pickleable weighted ensemble model for behavioral loads prediction"""
    
    def __init__(self, models=None, weights=None):
        self.models = models if models else []
        self.weights = weights if weights else []
        self.model_types = []
    
    def fit(self, X, y):
        """Fit all base models"""
        for model in self.models:
            model.fit(X, y)
            # Store model type for reference
            self.model_types.append(type(model).__name__)
        return self
    
    def predict(self, X):
        """Make weighted predictions"""
        if not self.models:
            raise ValueError("No models in ensemble")
        
        predictions = []
        for model, weight in zip(self.models, self.weights):
            pred = model.predict(X)
            predictions.append(pred * weight)
        
        # Sum weighted predictions
        return np.sum(predictions, axis=0)
    
    def get_params(self, deep=True):
        """Get parameters for sklearn compatibility"""
        return {
            'models': self.models,
            'weights': self.weights
        }
    
    def set_params(self, **params):
        """Set parameters for sklearn compatibility"""
        for key, value in params.items():
            setattr(self, key, value)
        return self
    
    def __repr__(self):
        model_info = []
        for i, (model_type, weight) in enumerate(zip(self.model_types, self.weights)):
            model_info.append(f"Model {i+1}: {model_type} (weight: {weight})")
        return f"WeightedEnsemble(\n  " + "\n  ".join(model_info) + "\n)"