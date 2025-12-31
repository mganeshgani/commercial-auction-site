const express = require('express');
const router = express.Router();
const formConfigController = require('../controllers/formConfig.controller');
const { protect } = require('../middleware/auth.middleware');

// Get available sport templates (protected)
router.get('/templates', protect, formConfigController.getSportTemplates);

// Get form configuration for logged-in auctioneer (protected)
router.get('/', protect, formConfigController.getFormConfig);

// Save/update form configuration (protected)
router.post('/', protect, formConfigController.saveFormConfig);

// Load a sport template (protected)
router.post('/load-template/:sportType', protect, formConfigController.loadSportTemplate);

// Get form configuration by registration token (public - for player registration)
router.get('/public/:token', formConfigController.getFormConfigByToken);

module.exports = router;
