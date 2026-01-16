// ML Forecast Service - Frontend
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

class MLForecastService {
  /**
   * Get solar generation forecast from ML model (max 24 hours)
   * Adds disclaimer that results are for reference only
   */
  async getSolarForecast(dateFrom, dateTo, useCache = true) {
    try {
      // Limit to 24 hours maximum
      const start = new Date(dateFrom);
      const end = new Date(dateTo);
      const hoursDiff = Math.ceil((end - start) / (1000 * 60 * 60));

      if (hoursDiff > 24) {
        // Adjust end date to 24 hours from start
        const adjustedEnd = new Date(start);
        adjustedEnd.setHours(adjustedEnd.getHours() + 24);
        dateTo = adjustedEnd.toISOString().split("T")[0];
        console.log(`Forecast limited to 24 hours: ${dateFrom} to ${dateTo}`);
      }

      const response = await fetch(
        `${API_BASE_URL}/ml/solar-forecast?` +
          `dateFrom=${dateFrom}&dateTo=${dateTo}&useCache=${useCache}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch solar forecast: ${response.statusText}`,
        );
      }

      const result = await response.json();

      // Add disclaimer to all forecast data
      if (result.data) {
        result.data = result.data.map((item) => ({
          ...item,
          disclaimer: "For reference only - ML prediction",
        }));
      }

      // Add disclaimer to summary
      if (result.summary) {
        result.summary.disclaimer =
          "Forecast results are for reference only. Actual generation may vary.";
        result.summary.max_hours = 24;
      }

      return result;
    } catch (error) {
      console.error("Error fetching ML forecast:", error);

      // Return a simple fallback with disclaimer
      return {
        success: false,
        data: [],
        summary: {
          total_kwh: 0,
          peak_kw: 0,
          prediction_count: 0,
          disclaimer:
            "Forecast temporarily unavailable. Results for reference only.",
          is_fallback: true,
        },
        model_info: {
          name: "Fallback",
          is_fallback: true,
        },
      };
    }
  }

  /**
   * Format forecast for charts
   */
  formatForecastForCharts(forecastData) {
    if (!forecastData || !forecastData.data) {
      return {
        hourly: [],
        daily: [],
        disclaimer: "No forecast data available",
      };
    }

    // Get only first 24 hours
    const limitedData = forecastData.data.slice(0, 24);

    const hourly = limitedData.map((item) => ({
      timestamp: new Date(item.timestamp),
      predicted_kw: item.predicted_kw,
      hour: item.hour,
      date: item.date,
      is_daylight: item.is_daylight,
      disclaimer: item.disclaimer || "For reference only",
    }));

    // Calculate totals for the 24-hour period
    const total_kwh = hourly.reduce((sum, item) => sum + item.predicted_kw, 0);
    const peak_kw = Math.max(...hourly.map((item) => item.predicted_kw));

    return {
      hourly,
      summary: {
        total_kwh: parseFloat(total_kwh.toFixed(2)),
        peak_kw: parseFloat(peak_kw.toFixed(2)),
        hours: hourly.length,
        disclaimer: "24-hour forecast for reference only",
      },
    };
  }

  /**
   * Get ML model info
   */
  async getModelInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/ml/model-info`);
      if (!response.ok) throw new Error("Failed to fetch model info");
      return await response.json();
    } catch (error) {
      console.error("Error fetching model info:", error);
      return null;
    }
  }
}

// Export singleton
const mlForecastService = new MLForecastService();
export default mlForecastService;
