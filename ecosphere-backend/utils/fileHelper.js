// File Helper - Handles file operations
const fs = require('fs');

class FileHelper {
  /**
   * Read JSON file (synchronous)
   * @param {string} filePath - Path to the file
   * @returns {Object} - Parsed JSON data
   */
  static readJSON(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Write JSON file (synchronous)
   * @param {string} filePath - Path to the file
   * @param {Object} data - Data to write
   * @returns {boolean} - Success status
   */
  static writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  }
}

module.exports = FileHelper;
