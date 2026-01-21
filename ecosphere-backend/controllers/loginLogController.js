// backend/controllers/loginLogController.js

/**
 * Login Log Controller
 * 
 * Handles HTTP requests for login/logout activity tracking
 * Used by Admin users to monitor system access and security
 * Logs are stored in JSON file (data/loginLogs.json)
 */

const loginLogService = require("../services/loginLogService");

/**
 * Get all login logs
 * 
 * Retrieves complete login/logout history for all users
 * Used by Admin dashboard to display user activity table
 * Logs include: email, role, login time, logout time, IP address, status
 * 
 * @route GET /api/login-logs
 * @access Admin only (protected by authMiddleware)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Array<Object>} Array of login log objects with timestamps
 * 
 * @example
 * Response: [
 *   {
 *     id: 1,
 *     email: "user@example.com",
 *     role: "TeamMember",
 *     loginTime: "2026-01-16T10:30:00Z",
 *     logoutTime: "2026-01-16T12:00:00Z",
 *     status: "success",
 *     ipAddress: "192.168.1.100"
 *   }
 * ]
 */
const getAllLogs = async (req, res) => {
  try {
    // Fetch all logs from JSON file via service layer
    // Service handles file reading and JSON parsing
    const logs = await loginLogService.getAllLogs();

    // Return logs as JSON array
    // Frontend will sort and filter these for display
    res.json(logs);
  } catch (error) {
    // Log error for debugging (file read errors, JSON parse errors)
    console.error("Error fetching login logs:", error);

    // Return generic error to client
    // Don't expose internal file paths or system details
    res.status(500).json({ error: "Failed to fetch login logs" });
  }
};

/**
 * Add new login log entry
 * 
 * Creates a new log record when user logs in (success or failure)
 * Called by firebaseAuthController after authentication attempt
 * Automatically adds timestamp and generates unique ID
 * 
 * @route POST /api/login-logs
 * @access Public (called during login process)
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Login log data
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.role - User's role (Admin/TeamMember/SuperAdmin)
 * @param {string} req.body.status - Login status ("success" or "failed")
 * @param {string} [req.body.failureReason] - Reason for failure (if status is "failed")
 * @param {string} req.body.ipAddress - Client IP address for security tracking
 * @param {Object} res - Express response object
 * @returns {Object} Created log entry with ID and timestamp
 * 
 * @example
 * Request body: {
 *   email: "user@example.com",
 *   role: "TeamMember",
 *   status: "success",
 *   ipAddress: "192.168.1.100"
 * }
 * 
 * Response: {
 *   id: 123,
 *   email: "user@example.com",
 *   role: "TeamMember",
 *   loginTime: "2026-01-16T10:30:00Z",
 *   status: "success",
 *   ipAddress: "192.168.1.100"
 * }
 */
const addLog = async (req, res) => {
  try {
    // Extract login data from request body
    // All fields are required except failureReason (only for failed logins)
    const { email, role, status, failureReason, ipAddress } = req.body;

    // Create new log entry via service layer
    // Service will:
    // 1. Generate unique ID
    // 2. Add current timestamp as loginTime
    // 3. Append to JSON file
    // 4. Return created log object
    const newLog = await loginLogService.addLog({
      email,
      role,
      status,
      failureReason,
      ipAddress,
    });

    // Return 201 Created with new log entry
    // Frontend stores log ID to update logout time later
    res.status(201).json(newLog);
  } catch (error) {
    // Log error for debugging (file write errors, validation errors)
    console.error("Error adding login log:", error);

    // Return generic error to client
    // This shouldn't fail unless file system has issues
    res.status(500).json({ error: "Failed to add login log" });
  }
};

/**
 * Update logout time for existing log entry
 * 
 * Records when user logs out by updating logoutTime field
 * Called when user clicks logout button or session expires
 * Uses log ID that was stored during login
 * 
 * @route PUT /api/login-logs/:id/logout
 * @access Public (called during logout process)
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Login log ID to update
 * @param {Object} res - Express response object
 * @returns {Object} Updated log entry with logoutTime
 * 
 * @example
 * Request: PUT /api/login-logs/123/logout
 * 
 * Response: {
 *   id: 123,
 *   email: "user@example.com",
 *   loginTime: "2026-01-16T10:30:00Z",
 *   logoutTime: "2026-01-16T12:00:00Z",
 *   ...
 * }
 */
const updateLogout = async (req, res) => {
  try {
    // Extract log ID from URL parameter
    // Convert to integer because JSON stores IDs as numbers
    const { id } = req.params;

    // Update logout time via service layer
    // Service will:
    // 1. Find log entry by ID
    // 2. Add current timestamp as logoutTime
    // 3. Save updated JSON file
    // 4. Return updated log object (or null if not found)
    const updatedLog = await loginLogService.updateLogout(parseInt(id));

    // Handle case where log ID doesn't exist
    // This can happen if:
    // - User manually edited localStorage
    // - Log was deleted by admin
    // - ID was corrupted
    if (!updatedLog) {
      return res.status(404).json({ error: "Login log not found" });
    }

    // Return updated log entry
    // Frontend doesn't need this data, but useful for debugging
    res.json(updatedLog);
  } catch (error) {
    // Log error for debugging (file errors, invalid ID format)
    console.error("Error updating logout:", error);

    // Return generic error to client
    // This shouldn't fail unless file system has issues
    res.status(500).json({ error: "Failed to update logout" });
  }
};

module.exports = {
  getAllLogs,
  addLog,
  updateLogout,
};
