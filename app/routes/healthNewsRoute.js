const express = require('express');
const router = express.Router();
const healthNewsController = require('../controllers/healthNewsController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes - anyone can read the cached health news
// Get all health news with pagination
router.get('/', healthNewsController.getAllHealthNews);

// Get latest health news (limited)
router.get('/latest', healthNewsController.getLatestHealthNews);

// Get health news by source
router.get('/source/:source', healthNewsController.getHealthNewsBySource);

// Internal import endpoint (used by the Python scraper to push results directly)
// Secured by checking x-internal-token header inside the controller
router.post('/import', healthNewsController.importHealthNews);

// Protected routes - require authentication
// Sync health news from Python server
router.post('/sync', authenticate, healthNewsController.syncHealthNews);

// Manually refresh health news from Python server
router.post('/refresh', authenticate, healthNewsController.refreshHealthNews);

// Delete old health news (admin only)
router.delete('/cleanup', authenticate, healthNewsController.deleteOldHealthNews);

module.exports = router;
