// Electricity Routes - SQL Server based
const express = require('express');
const router = express.Router();
const {
  getAvailableDateRange,
  getConsumptionData,
  getGenerationData,
  getNetEnergyData,
  getPhaseBreakdownData,
  getEquipmentBreakdownData,
  getSolarSourceBreakdownData,
  getElectricityOverview
} = require('../controllers/electricityController');

// Get available date range
router.get('/date-range', getAvailableDateRange);

// Get comprehensive overview (consumption + generation + net energy)
router.get('/overview/:dateFrom/:dateTo', getElectricityOverview);

// Get consumption data (TL341)
router.get('/consumption/:dateFrom/:dateTo', getConsumptionData);

// Get generation data (TL340)
router.get('/generation/:dateFrom/:dateTo', getGenerationData);

// Get net energy data (TL339)
router.get('/net-energy/:dateFrom/:dateTo', getNetEnergyData);

// Get phase breakdown data (TL342-345)
router.get('/phase-breakdown/:dateFrom/:dateTo', getPhaseBreakdownData);

// Get equipment breakdown data (TL213, TL4, TL209-212)
router.get('/equipment-breakdown/:dateFrom/:dateTo', getEquipmentBreakdownData);

// Get solar source breakdown data (TL252-253)
router.get('/solar-breakdown/:dateFrom/:dateTo', getSolarSourceBreakdownData);

module.exports = router;
