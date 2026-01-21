const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class LoginLogService {
  // Get all login logs
  static async getAllLogs() {
    try {
      const response = await fetch(`${API_BASE_URL}/login-logs`);
      if (!response.ok) {
        throw new Error('Failed to fetch login logs');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching login logs:', error);
      throw error;
    }
  }

  // Add a new login log
  static async addLog(logData) {
    try {
      const response = await fetch(`${API_BASE_URL}/login-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add login log');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding login log:', error);
      throw error;
    }
  }

  // Update logout information
  static async updateLogout(logId) {
    try {
      const response = await fetch(`${API_BASE_URL}/login-logs/${logId}/logout`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update logout');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating logout:', error);
      throw error;
    }
  }
}

export default LoginLogService;
