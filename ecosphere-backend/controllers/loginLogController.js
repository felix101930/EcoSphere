const loginLogService = require('../services/loginLogService');

class LoginLogController {
  // Get all login logs
  static async getAllLogs(req, res) {
    try {
      const logs = await loginLogService.getAllLogs();
      res.json(logs);
    } catch (error) {
      console.error('Error fetching login logs:', error);
      res.status(500).json({ error: 'Failed to fetch login logs' });
    }
  }

  // Add a new login log
  static async addLog(req, res) {
    try {
      const { email, role, status, failureReason, ipAddress } = req.body;
      
      const newLog = await loginLogService.addLog({
        email,
        role,
        status,
        failureReason,
        ipAddress
      });
      
      res.status(201).json(newLog);
    } catch (error) {
      console.error('Error adding login log:', error);
      res.status(500).json({ error: 'Failed to add login log' });
    }
  }

  // Update logout information
  static async updateLogout(req, res) {
    try {
      const { id } = req.params;
      
      const updatedLog = await loginLogService.updateLogout(parseInt(id));
      
      if (!updatedLog) {
        return res.status(404).json({ error: 'Login log not found' });
      }
      
      res.json(updatedLog);
    } catch (error) {
      console.error('Error updating logout:', error);
      res.status(500).json({ error: 'Failed to update logout' });
    }
  }
}

module.exports = LoginLogController;
