"""
Check model info for Node.js integration
"""
import json
import joblib
import sys
import os

def main():
    try:
        # Get current directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'solar_forecast_openweather.pkl')
        
        # Check if file exists
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        # Load model
        model_data = joblib.load(model_path)
        
        # Prepare info
        info = {
            'success': True,
            'model': {
                'type': type(model_data.get('model')).__name__,
                'feature_count': len(model_data.get('feature_names', [])),
                'metrics': model_data.get('metrics', {}),
                'loaded': True
            },
            'service': {
                'python_version': sys.version.split()[0],
                'model_path': model_path,
                'file_exists': os.path.exists(model_path),
                'file_size': os.path.getsize(model_path)
            }
        }
        
        print(json.dumps(info))
        
    except Exception as e:
        error_info = {
            'success': False,
            'error': str(e),
            'model': {
                'loaded': False
            }
        }
        print(json.dumps(error_info))

if __name__ == "__main__":
    main()