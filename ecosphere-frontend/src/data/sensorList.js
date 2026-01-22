
export const SENSORS = [
    // Environmental
    { label: "Outside Temp", table: "dbo.SaitSolarLab_20000_TL92", unit: "°C", category: "Environment" },
    { label: "CO2 Level", table: "dbo.SaitSolarLab_20016_TL5", unit: "ppm", category: "Environment" },
    
    // Thermal - Basement
    { label: "Basement East", table: "dbo.SaitSolarLab_20004_TL2", unit: "°C", category: "Thermal" },
    { label: "Basement West", table: "dbo.SaitSolarLab_20005_TL2", unit: "°C", category: "Thermal" },
    
    // Thermal - Level 1
    { label: "Level 1 West", table: "dbo.SaitSolarLab_20007_TL2", unit: "°C", category: "Thermal" },
    { label: "Level 1 South", table: "dbo.SaitSolarLab_20009_TL2", unit: "°C", category: "Thermal" },
    
    // Energy - Generation
    { label: "Total Solar Gen", table: "dbo.SaitSolarLab_30000_TL3", unit: "kW", category: "Energy Gen" },
    { label: "Rooftop Solar", table: "dbo.SaitSolarLab_30000_TL253", unit: "kW", category: "Energy Gen" },
    { label: "Carport Solar", table: "dbo.SaitSolarLab_30000_TL252", unit: "kW", category: "Energy Gen" },
    
    // Energy - Consumption
    { label: "Total Site Cons", table: "dbo.SaitSolarLab_30000_TL342", unit: "kW", category: "Energy Load" },
    { label: "Lighting", table: "dbo.SaitSolarLab_30000_TL209", unit: "kW", category: "Energy Load" },
    { label: "HVAC", table: "dbo.SaitSolarLab_30000_TL208", unit: "kW", category: "Energy Load" },
    
    // Hourly History (Aggregates)
    { label: "Hourly Gen History", table: "dbo.SaitSolarLab_30000_TL340", unit: "Wh", category: "History" },
    { label: "Hourly Cons History", table: "dbo.SaitSolarLab_30000_TL341", unit: "Wh", category: "History" }
];