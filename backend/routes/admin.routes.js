const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// All routes require authentication and admin role
router.use(protect, isAdmin);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// Auctioneers management
router.post('/auctioneers/create', adminController.createAuctioneer);
router.get('/auctioneers', adminController.getAllAuctioneers);
router.get('/auctioneers/:id', adminController.getAuctioneer);
router.put('/auctioneers/:id', adminController.updateAuctioneer);
router.delete('/auctioneers/:id', adminController.deleteAuctioneer);
router.delete('/auctioneers/:id/reset', adminController.resetAuctioneerData);

// Access control
router.post('/auctioneers/:id/grant-access', adminController.grantAccess);
router.post('/auctioneers/:id/revoke-access', adminController.revokeAccess);

module.exports = router;
