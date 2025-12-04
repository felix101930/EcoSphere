// backend/controllers/loginLogController.js
const loginLogService = require("../services/loginLogService");

const getAllLogs = async (req, res) => {
  try {
    const logs = await loginLogService.getAllLogs();
    res.json(logs);
  } catch (error) {
    console.error("Error fetching login logs:", error);
    res.status(500).json({ error: "Failed to fetch login logs" });
  }
};

const addLog = async (req, res) => {
  try {
    const { email, role, status, failureReason, ipAddress } = req.body;

    const newLog = await loginLogService.addLog({
      email,
      role,
      status,
      failureReason,
      ipAddress,
    });

    res.status(201).json(newLog);
  } catch (error) {
    console.error("Error adding login log:", error);
    res.status(500).json({ error: "Failed to add login log" });
  }
};

const updateLogout = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedLog = await loginLogService.updateLogout(parseInt(id));

    if (!updatedLog) {
      return res.status(404).json({ error: "Login log not found" });
    }

    res.json(updatedLog);
  } catch (error) {
    console.error("Error updating logout:", error);
    res.status(500).json({ error: "Failed to update logout" });
  }
};

module.exports = {
  getAllLogs,
  addLog,
  updateLogout,
};
