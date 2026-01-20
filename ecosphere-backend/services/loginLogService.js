/**
 * Login Log Service
 * 
 * Manages login/logout activity logs stored in JSON file
 * Tracks user authentication events for security monitoring and audit trails
 * Used by Admin dashboard to display user activity history
 * 
 * Data stored in: data/loginLogs.json
 * Format: { logs: [{ id, timestamp, email, role, status, failureReason, ipAddress, logoutTimestamp }] }
 */

const path = require('path');
const FileHelper = require('../utils/fileHelper');

class LoginLogService {
  // Path to login logs JSON file
  static LOG_FILE = path.join(__dirname, '../data/loginLogs.json');

  /**
   * Get all login logs
   * 
   * Retrieves complete login/logout history for all users
   * Logs are sorted by timestamp descending (newest first)
   * Used by Admin dashboard to display activity table
   * 
   * @returns {Promise<Array<Object>>} Array of login log objects sorted by timestamp
   * 
   * @example
   * const logs = await LoginLogService.getAllLogs();
   * // Returns: [
   * //   {
   * //     id: 123,
   * //     timestamp: "2026-01-16 10:30:00",
   * //     email: "user@example.com",
   * //     role: "TeamMember",
   * //     status: "success",
   * //     failureReason: null,
   * //     ipAddress: "192.168.1.100",
   * //     logoutTimestamp: "2026-01-16 12:00:00"
   * //   }
   * // ]
   */
  static async getAllLogs() {
    try {
      // Read logs from JSON file
      const data = await FileHelper.readJSON(this.LOG_FILE);

      // Sort by timestamp descending (newest first)
      // This ensures most recent activity appears at top of admin dashboard
      const sortedLogs = data.logs.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      return sortedLogs;
    } catch (error) {
      // Log error for debugging (file read errors, JSON parse errors)
      console.error('Error reading login logs:', error);

      // Return empty array instead of throwing
      // This prevents admin dashboard from crashing if log file is missing
      return [];
    }
  }

  /**
   * Add a new login log entry
   * 
   * Creates a new log record when user logs in (success or failure)
   * Automatically generates unique ID and timestamp
   * Timestamp uses local time (Calgary/MST) for easier debugging
   * 
   * @param {Object} logData - Login event data
   * @param {string} logData.email - User's email address
   * @param {string} logData.role - User's role (Admin/TeamMember/SuperAdmin)
   * @param {string} logData.status - Login status ("success" or "failed")
   * @param {string} [logData.failureReason] - Reason for failure (if status is "failed")
   * @param {string} [logData.ipAddress] - Client IP address (defaults to 127.0.0.1)
   * @returns {Promise<Object>} Created log entry with ID and timestamp
   * 
   * @throws {Error} If file write fails
   * 
   * @example
   * const log = await LoginLogService.addLog({
   *   email: "user@example.com",
   *   role: "TeamMember",
   *   status: "success",
   *   ipAddress: "192.168.1.100"
   * });
   * // Returns: { id: 123, timestamp: "2026-01-16 10:30:00", ... }
   */
  static async addLog(logData) {
    try {
      // Read current logs from JSON file
      const data = await FileHelper.readJSON(this.LOG_FILE);

      // Generate new unique ID
      // Find highest existing ID and add 1, or start at 1 if no logs exist
      const newId = data.logs.length > 0
        ? Math.max(...data.logs.map(log => log.id)) + 1
        : 1;

      // Create timestamp in local time (Calgary/MST)
      // Format: YYYY-MM-DD HH:MM:SS
      // Using local time makes logs easier to read and debug
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      // Create new log entry object
      const newLog = {
        id: newId,
        timestamp,
        email: logData.email,
        role: logData.role,
        status: logData.status,                           // "success" or "failed"
        failureReason: logData.failureReason || null,     // Only set for failed logins
        ipAddress: logData.ipAddress || '127.0.0.1',      // Default to localhost if not provided
        logoutTimestamp: null                              // Will be set when user logs out
      };

      // Add to logs array
      data.logs.push(newLog);

      // Save updated logs to JSON file
      await FileHelper.writeJSON(this.LOG_FILE, data);

      // Return created log entry
      // Frontend stores log ID to update logout time later
      return newLog;
    } catch (error) {
      // Log error for debugging
      console.error('Error adding login log:', error);

      // Re-throw error so controller can handle it
      // This is critical operation - login should fail if logging fails
      throw error;
    }
  }

  /**
   * Update logout timestamp for existing log entry
   * 
   * Records when user logs out by updating logoutTimestamp field
   * Called when user clicks logout button or session expires
   * Uses log ID that was stored during login
   * 
   * @param {number} logId - Login log ID to update
   * @returns {Promise<Object|null>} Updated log entry, or null if not found
   * 
   * @throws {Error} If file write fails
   * 
   * @example
   * const log = await LoginLogService.updateLogout(123);
   * // Returns: { id: 123, logoutTimestamp: "2026-01-16 12:00:00", ... }
   */
  static async updateLogout(logId) {
    try {
      // Read current logs from JSON file
      const data = await FileHelper.readJSON(this.LOG_FILE);

      // Find the log entry by ID
      const logIndex = data.logs.findIndex(log => log.id === logId);

      // Handle case where log ID doesn't exist
      // This can happen if:
      // - User manually edited localStorage
      // - Log was deleted by admin
      // - ID was corrupted
      if (logIndex === -1) {
        return null;
      }

      // Create logout timestamp in local time (Calgary/MST)
      // Format: YYYY-MM-DD HH:MM:SS
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const logoutTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      // Update logout timestamp in log entry
      data.logs[logIndex].logoutTimestamp = logoutTimestamp;

      // Save updated logs to JSON file
      await FileHelper.writeJSON(this.LOG_FILE, data);

      // Return updated log entry
      return data.logs[logIndex];
    } catch (error) {
      // Log error for debugging
      console.error('Error updating logout:', error);

      // Re-throw error so controller can handle it
      throw error;
    }
  }

  /**
   * Find the most recent successful login for a user
   * 
   * Searches for the latest successful login without logout timestamp
   * Used to automatically update logout when user logs out
   * Helps handle cases where logout wasn't recorded properly
   * 
   * @param {string} email - User's email address
   * @returns {Promise<Object|null>} Most recent login log, or null if not found
   * 
   * @example
   * const log = await LoginLogService.findRecentLoginByEmail("user@example.com");
   * // Returns: { id: 123, timestamp: "2026-01-16 10:30:00", logoutTimestamp: null, ... }
   */
  static async findRecentLoginByEmail(email) {
    try {
      // Read logs from JSON file
      const data = await FileHelper.readJSON(this.LOG_FILE);

      // Find the most recent successful login without logout
      // Filter criteria:
      // 1. Email matches
      // 2. Status is "success" (ignore failed logins)
      // 3. No logout timestamp (user still logged in)
      // Then sort by timestamp descending and take first result
      const recentLogin = data.logs
        .filter(log => log.email === email && log.status === 'success' && !log.logoutTimestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      // Return found log or null if no matching log exists
      return recentLogin || null;
    } catch (error) {
      // Log error for debugging
      console.error('Error finding recent login:', error);

      // Return null instead of throwing
      // This is a helper function - failure shouldn't break logout process
      return null;
    }
  }
}

module.exports = LoginLogService;
