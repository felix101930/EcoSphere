import json
import joblib
import sys
import os
import traceback

def main():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'solar_forecast_openweather.pkl')
        
        print(f"Looking for model at: {model_path}", file=sys.stderr)
        print(f"File exists: {os.path.exists(model_path)}", file=sys.stderr)
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        print(f"File size: {os.path.getsize(model_path)} bytes", file=sys.stderr)
        
        # Try to load with more specific error handling
        model_data = joblib.load(model_path)
        
        print("Model loaded successfully!", file=sys.stderr)
        
        info = {
            'success': True,
            'model': {
                'type': type(model_data.get('model')).__name__ if 'model' in model_data else 'Unknown',
                'keys': list(model_data.keys()),
                'loaded': True
            }
        }
        
        print(json.dumps(info))
        
    except Exception as e:
        error_info = {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error_info, default=str))

if __name__ == "__main__":
    main()