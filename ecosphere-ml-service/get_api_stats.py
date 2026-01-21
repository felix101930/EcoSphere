import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Get current date
current_datetime = datetime.now().isoformat()

print(f"Running get_api_stats.py at {current_datetime}", file=sys.stderr)

try:
    # Try to import weather service to get actual stats
    sys.path.append(os.path.dirname(__file__))
    from weather_service import weather_service
    
    stats = weather_service.get_api_stats()
    stats.update({
        "success": True,
        "generated_at": current_datetime,
        "service": "OpenWeather API"
    })
    
except Exception as e:
    print(f"Error getting API stats: {e}", file=sys.stderr)
    
    # Fallback if no weather service
    stats = {
        "success": True,
        "calls_today": 0,
        "max_calls_per_day": 950,
        "remaining_calls": 950,
        "last_reset": datetime.now().isoformat(),
        "today": datetime.now().strftime('%Y-%m-%d'),
        "generated_at": current_datetime,
        "service": "OpenWeather API (Fallback)"
    }

print(json.dumps(stats))