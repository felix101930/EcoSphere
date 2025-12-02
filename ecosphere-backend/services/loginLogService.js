const path = require('path');
const FileHelper = require('../utils/fileHelper');

class LoginLogService {
  static LOG_FILE = path.join(__dirname, '../data/loginLogs.json');

  // Get all login logs (sorted by timestamp descending)
  static async getAllLogs() {
    try {
      const data = await FileHelper.readJSON(this.LOG_FILE);
      // Sort by timestamp descending (newest first)
      const sortedLogs = data.logs.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      return sortedLogs;
    } catch (error) {
      console.error('Error reading login logs:', error);
      return [];
    }
  }

  // Add a new login log
  static async addLog(logData) {
    try {
      const data = await FileHelper.readJSON(this.LOG_FILE);
      
      // Generate new ID
      const newId = data.logs.length > 0 
        ? Math.max(...data.logs.map(log => log.id)) + 1 
        : 1;
      
      // Create timestamp in local time (Calgary/MST)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      
      // Create new log entry
      const newLog = {
        id: newId,
        timestamp,
        email: logData.email,
        role: logData.role,
        status: logData.status,
        failureReason: logData.failureReason || null,
        ipAddress: logData.ipAddress || '127.0.0.1',
        logoutTimestamp: null
      };
      
      // Add to logs array
      data.logs.push(newLog);
      
      // Save to file
      await FileHelper.writeJSON(this.LOG_FILE, data);
      
      return newLog;
    } catch (error) {
      console.error('Error adding login log:', error);
      throw error;
    }
  }

  // Update logout information
  static async updateLogout(logId) {
    try {
      const data = await FileHelper.readJSON(this.LOG_FILE);
      
      // Find the log entry
      const logIndex = data.logs.findIndex(log => log.id === logId);
      
      if (logIndex === -1) {
        return null;
      }
      
      // Update logout information with local time
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const logoutTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      
      data.logs[logIndex].logoutTimestamp = logoutTimestamp;
      
      // Save to file
      await FileHelper.writeJSON(this.LOG_FILE, data);
      
      return data.logs[logIndex];
    } catch (error) {
      console.error('Error updating logout:', error);
      throw error;
    }
  }

  // Find the most recent successful login for a user (to update logout)
  static async findRecentLoginByEmail(email) {
    try {
      const data = await FileHelper.readJSON(this.LOG_FILE);
      
      // Find the most recent successful login without logout
      const recentLogin = data.logs
        .filter(log => log.email === email && log.status === 'success' && !log.logoutTimestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      
      return recentLogin || null;
    } catch (error) {
      console.error('Error finding recent login:', error);
      return null;
    }
  }
}

module.exports = LoginLogService;
