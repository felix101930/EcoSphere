// File Helper - Handles file operations
const fs = require('fs').promises;

class FileHelper {
  /**
   * Read JSON file
   * @param {string} filePath - Path to the file
   * @returns {Promise<Object>} - Parsed JSON data
   */
  static async readJSON(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  /**
   * Write JSON file
   * @param {string} filePath - Path to the file
   * @param {Object} data - Data to write
   * @returns {Promise<boolean>} - Success status
   */
  static async writeJSON(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }
}

module.exports = FileHelper;
