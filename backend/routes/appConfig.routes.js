const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth.middleware');
const { getConfig, updateConfig, resetConfig } = require('../controllers/appConfig.controller');

// Multer configuration for file upload (logo)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes require authentication
router.use(protect);

router.get('/', getConfig);
router.put('/', upload.single('logo'), updateConfig);
router.delete('/', resetConfig);

module.exports = router;
