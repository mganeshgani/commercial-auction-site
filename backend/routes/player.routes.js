const express = require('express');
const router = express.Router();
const multer = require('multer');
const playerController = require('../controllers/player.controller');
const { protect } = require('../middleware/auth.middleware');

// Configure multer for photo upload (memory storage for Cloudinary)
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (for HEIC files)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|heic|heif/i;
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
    // Accept common image mimetypes including mobile formats
    const mimetype = file.mimetype.startsWith('image/');
    
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP, HEIC) are allowed'));
    }
  }
});

// Player registration with photo upload (public - uses token validation)
router.post('/register', photoUpload.single('photo'), playerController.registerPlayer);

// Protected routes - require authentication
router.use(protect);

// Get random unsold player (must be before /:playerId)
router.get('/random', playerController.getRandomPlayer);

// Get all unsold players (must be before /:playerId)
router.get('/unsold', playerController.getUnsoldPlayers);

// Delete all players (for auction reset - must be before /:playerId)
router.delete('/', playerController.deleteAllPlayers);

// Get all players
router.get('/', playerController.getAllPlayers);

// Create player from admin panel (must be before /:playerId)
router.post('/', photoUpload.single('photo'), playerController.createPlayer);

// Assign player to team
router.post('/:playerId/assign', playerController.assignPlayer);

// Mark player as unsold
router.post('/:playerId/unsold', playerController.markUnsold);

// Remove player from team
router.delete('/:playerId/remove-from-team', playerController.removePlayerFromTeam);

// Update player (PATCH and PUT for compatibility)
router.patch('/:playerId', playerController.updatePlayer);
router.put('/:playerId', playerController.updatePlayer);

// Delete single player
router.delete('/:playerId', playerController.deletePlayer);

module.exports = router;