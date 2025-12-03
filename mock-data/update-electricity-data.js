// Script to UPDATE electricity.json with new data
// Reads the last record and generates new data from that point to current time
// Run: node update-electricity-data.js

const fs = require('fs');
const path = require('path');

/**
 * Generate realistic electricity data for one hour
 * @param {Date} currentDate - The date/time for this record
 * @returns {number} Power consumption in Watts
 */
function generatePowerForHour(currentDate) {
  const hour = currentDate.getHours();
  const dayOfWeek = currentDate.getDay(); // 0=Sunday, 6=Saturday
  const month = currentDate.getMonth(); // 0=Jan, 11=Dec
  
  // Base load: 15-25 kW (always on systems, lighting, HVAC baseline)
  let power = 18000 + Math.random() * 7000; // 18-25 kW
  
  // Business hours pattern (8am-6pm, Mon-Fri)
  const isBusinessHours = hour >= 8 && hour <= 18;
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  if (isBusinessHours && isWeekday) {
    // Peak office hours: 40-70 kW
    power += 25000 + Math.random() * 20000; // +25-45 kW
  } else if (isBusinessHours && !isWeekday) {
    // Weekend daytime: 20-35 kW (reduced occupancy)
    power += 5000 + Math.random() * 10000; // +5-15 kW
  } else if (hour >= 22 || hour <= 6) {
    // Night hours: 10-18 kW (minimal operations)
    power -= 5000 + Math.random() * 3000; // -5-8 kW
  }
  
  // Seasonal variation (heating/cooling)
  // Winter (Dec, Jan, Feb): +20% for heating
  // Summer (Jun, Jul, Aug): +15% for cooling
  if (month === 11 || month === 0 || month === 1) {
    power *= 1.15 + Math.random() * 0.1; // +15-25%
  } else if (month >= 5 && month <= 7) {
    power *= 1.10 + Math.random() * 0.08; // +10-18%
  }
  
  // Add realistic noise/variation
  power += (Math.random() - 0.5) * 2000; // ±1 kW random variation
  
  // Ensure power is positive and round to realistic precision
  power = Math.max(8000, power); // Minimum 8 kW
  power = Math.round(power * 100) / 100; // Round to 2 decimals
  
  return power;
}

/**
 * Parse SQL Server timestamp to Date object (LOCAL TIME)
 * @param {string} ts - Timestamp like "2025-12-02 12:00:00.0000000"
 * @returns {Date}
 */
function parseTimestamp(ts) {
  // Parse as local time, not UTC
  const parts = ts.substring(0, 19).split(' ');
  const dateParts = parts[0].split('-');
  const timeParts = parts[1].split(':');
  
  return new Date(
    parseInt(dateParts[0]), // year
    parseInt(dateParts[1]) - 1, // month (0-indexed)
    parseInt(dateParts[2]), // day
    parseInt(timeParts[0]), // hour
    parseInt(timeParts[1]), // minute
    parseInt(timeParts[2])  // second
  );
}

/**
 * Format Date to SQL Server timestamp (LOCAL TIME)
 * @param {Date} date
 * @returns {string}
 */
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}.0000000`;
}

// Main function
function updateElectricityData() {
  console.log('=== GBTAC Electricity Data Updater ===');
  console.log('');
  
  // Read existing file
  const filePath = path.join(__dirname, 'electricity.json');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Error: electricity.json not found!');
    console.error('Please run generate-electricity-data.js first.');
    process.exit(1);
  }
  
  console.log('📖 Reading electricity.json...');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(fileContent);
  
  // Get last record
  const lastRecord = jsonData.data[jsonData.data.length - 1];
  const lastDate = parseTimestamp(lastRecord.ts);
  const lastSeq = lastRecord.seq;
  
  console.log(`📅 Last record: ${lastRecord.ts}`);
  console.log(`🔢 Last sequence: ${lastSeq}`);
  
  // Get current time (rounded down to the hour)
  const now = new Date();
  now.setMinutes(0, 0, 0); // Round down to hour
  
  console.log(`🕐 Current time: ${formatTimestamp(now)}`);
  
  // Calculate how many hours to add
  const hoursToAdd = Math.floor((now - lastDate) / (1000 * 60 * 60));
  
  if (hoursToAdd <= 0) {
    console.log('');
    console.log('✅ Data is already up to date!');
    console.log('No new records needed.');
    return;
  }
  
  console.log(`➕ Need to add ${hoursToAdd} new records`);
  console.log('');
  console.log('Generating new data...');
  
  // Generate new records
  const newRecords = [];
  let seq = lastSeq + 1;
  
  for (let i = 1; i <= hoursToAdd; i++) {
    const currentDate = new Date(lastDate);
    currentDate.setHours(lastDate.getHours() + i);
    
    const power = generatePowerForHour(currentDate);
    const ts = formatTimestamp(currentDate);
    
    newRecords.push({
      seq: seq++,
      ts: ts,
      value: power
    });
    
    // Progress indicator
    if (i % 100 === 0 || i === hoursToAdd) {
      console.log(`Progress: ${i}/${hoursToAdd} records (${Math.round(i/hoursToAdd*100)}%)`);
    }
  }
  
  // Add new records to existing data
  jsonData.data.push(...newRecords);
  
  // Update metadata
  jsonData.metadata.endDate = formatTimestamp(now).substring(0, 10);
  jsonData.metadata.totalRecords = jsonData.data.length;
  
  // Write back to file
  console.log('');
  console.log('💾 Saving updated data...');
  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  
  console.log('');
  console.log('✅ Update complete!');
  console.log(`📁 File: ${filePath}`);
  console.log(`➕ Added records: ${newRecords.length}`);
  console.log(`📊 Total records: ${jsonData.data.length}`);
  console.log(`📅 New date range: ${jsonData.data[0].ts} to ${jsonData.data[jsonData.data.length - 1].ts}`);
  console.log(`💾 File size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
}

// Run the update
try {
  updateElectricityData();
} catch (error) {
  console.error('');
  console.error('❌ Error occurred:');
  console.error(error.message);
  process.exit(1);
}
