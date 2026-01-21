import sys
import os
sys.path.append(os.path.dirname(__file__))

from node_service import SolarForecastService
from datetime import datetime, timedelta

def quick_test():
    print("🧪 Quick Test of Solar Forecast Service")
    print("=" * 60)
    
    try:
        # Initialize service
        service = SolarForecastService('solar_forecast_openweather.pkl')
        
        # Get today and tomorrow
        current_time = datetime.now()
        today = current_time.strftime('%Y-%m-%d')
        tomorrow = (current_time + timedelta(days=1)).strftime('%Y-%m-%d')
        
        print(f"📅 Testing: {today} to {tomorrow}")
        print(f"🕐 Current time: {current_time}")
        
        # Test with weather
        print(f"\n🌤️ Testing WITH weather data...")
        result = service.predict_range(today, tomorrow, use_weather=True, force_fresh=True)
        
        if result['success']:
            print(f"✅ Success! Generated {len(result['data'])} predictions")
            print(f"📊 Total kWh: {result['summary']['total_kwh']}")
            print(f"🏔️ Peak kW: {result['summary']['peak_kw']}")
            print(f"🤖 Model: {result['model_info']['name']}")
            print(f"📡 Weather integrated: {result['model_info']['weather_integrated']}")
            print(f"📊 API calls remaining: {result['api_stats']['remaining_calls']}")
            
            # Show sample predictions
            if result['data']:
                print(f"\n📋 Sample predictions:")
                for i, pred in enumerate(result['data'][:3]):
                    weather_info = ""
                    if 'weather' in pred:
                        weather_info = f" | UV: {pred['weather']['uv_index']:.1f} | Clouds: {pred['weather']['clouds_pct']}%"
                    print(f"   {pred['timestamp'][11:16]}: {pred['predicted_kw']:.2f} kW{weather_info}")
        
        return result
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    quick_test()