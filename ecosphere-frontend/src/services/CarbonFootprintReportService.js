import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class CarbonFootprintReportService {
  // Create a new report record
  static async createReport(reportData) {
    try {
      const userStr = sessionStorage.getItem('ecosphere_current_user');
      console.log('Creating report with user:', userStr ? 'exists' : 'missing');
      console.log('API URL:', `${API_BASE_URL}/carbon-footprint-reports`);
      console.log('Report data:', reportData);
      
      const response = await axios.post(
        `${API_BASE_URL}/carbon-footprint-reports`,
        reportData,
        {
          headers: {
            'Authorization': `Bearer ${userStr}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Create report response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating report:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  }

  // Get all reports for current user
  static async getReports(page = 1, limit = 10) {
    try {
      const userStr = sessionStorage.getItem('ecosphere_current_user');
      const response = await axios.get(
        `${API_BASE_URL}/carbon-footprint-reports?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${userStr}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  // Get a specific report by ID
  static async getReportById(id) {
    try {
      const userStr = sessionStorage.getItem('ecosphere_current_user');
      const response = await axios.get(
        `${API_BASE_URL}/carbon-footprint-reports/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${userStr}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }

  // Delete a report
  static async deleteReport(id) {
    try {
      const userStr = sessionStorage.getItem('ecosphere_current_user');
      const response = await axios.delete(
        `${API_BASE_URL}/carbon-footprint-reports/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${userStr}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // Get report statistics
  static async getReportStats() {
    try {
      const userStr = sessionStorage.getItem('ecosphere_current_user');
      const response = await axios.get(
        `${API_BASE_URL}/carbon-footprint-reports/stats`,
        {
          headers: {
            'Authorization': `Bearer ${userStr}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching report stats:', error);
      throw error;
    }
  }
}

export default CarbonFootprintReportService;
