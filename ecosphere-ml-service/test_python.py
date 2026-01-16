"""
Test the Python service directly
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(__file__))

from node_service import SolarForecastService
from datetime import datetime

def test_service():
    print("🧪 Testing Solar Forecast Service")
    print("=" * 60)
    
    try:
        # Initialize service
        service = SolarForecastService('solar_forecast_openweather.pkl')
        
        # Test single prediction
        test_time = datetime(2024, 6, 15, 12, 0, 0)  # June 15, noon
        prediction = service.predict_for_datetime(test_time)
        
        print(f"✅ Model loaded: {type(service.model).__name__}")
        print(f"📊 R² score: {service.metrics.get('r2', 0):.3f}")
        print(f"🔧 Features: {len(service.feature_names)}")
        print(f"\n🔮 Test prediction for {test_time}:")
        print(f"   Predicted: {prediction:.2f} kW")
        
        # Test date range
        print(f"\n📅 Testing date range...")
        predictions = service.predict_range('2024-06-01', '2024-06-03')
        
        print(f"✅ Generated {len(predictions)} predictions")
        
        # Show first 5 predictions
        print(f"\n📋 First 5 predictions:")
        for i, pred in enumerate(predictions[:5]):
            print(f"   {i+1}. {pred['timestamp']}: {pred['predicted_kw']:.2f} kW")
        
        # Calculate summary
        total_kwh = sum(p['predicted_kw'] for p in predictions)
        peak_kw = max(p['predicted_kw'] for p in predictions)
        
        print(f"\n📈 Summary for Jun 1-3, 2024:")
        print(f"   Total generation: {total_kwh:.1f} kWh")
        print(f"   Peak output: {peak_kw:.2f} kW")
        print(f"   Average per daylight hour: {total_kwh/len(predictions):.2f} kW")
        
        print(f"\n" + "=" * 60)
        print("🎉 All tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = test_service()
    sys.exit(0 if success else 1)