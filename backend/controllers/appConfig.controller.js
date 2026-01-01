const AppConfig = require('../models/appConfig.model');
const cloudinary = require('../config/cloudinary');

// @desc    Get app configuration for logged-in auctioneer
// @route   GET /api/config
// @access  Protected
exports.getConfig = async (req, res) => {
  try {
    let config = await AppConfig.findOne({ auctioneer: req.user._id });
    
    // If no config exists, create default one
    if (!config) {
      config = await AppConfig.create({
        auctioneer: req.user._id,
        branding: {
          title: 'SPORTS AUCTION',
          subtitle: 'St Aloysius (Deemed To Be University)',
          logoUrl: ''
        }
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching configuration'
    });
  }
};

// @desc    Update app configuration
// @route   PUT /api/config
// @access  Protected
exports.updateConfig = async (req, res) => {
  try {
    const { title, subtitle } = req.body;
    
    let config = await AppConfig.findOne({ auctioneer: req.user._id });
    
    if (!config) {
      config = new AppConfig({
        auctioneer: req.user._id,
        branding: {}
      });
    }
    
    // Update text fields
    if (title !== undefined) {
      config.branding.title = title;
    }
    if (subtitle !== undefined) {
      config.branding.subtitle = subtitle;
    }
    
    // Handle logo upload if file is present
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'app-logos',
              public_id: `logo_${req.user._id}_${Date.now()}`,
              resource_type: 'image',
              transformation: [
                { width: 200, height: 200, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        config.branding.logoUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Error uploading logo:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Error uploading logo'
        });
      }
    }
    
    await config.save();
    
    res.json({
      success: true,
      data: config,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating configuration'
    });
  }
};

// @desc    Reset app configuration to default
// @route   DELETE /api/config
// @access  Protected
exports.resetConfig = async (req, res) => {
  try {
    await AppConfig.findOneAndDelete({ auctioneer: req.user._id });
    
    // Create new default config
    const config = await AppConfig.create({
      auctioneer: req.user._id,
      branding: {
        title: 'SPORTS AUCTION',
        subtitle: 'St Aloysius (Deemed To Be University)',
        logoUrl: ''
      }
    });
    
    res.json({
      success: true,
      data: config,
      message: 'Configuration reset to default'
    });
  } catch (error) {
    console.error('Error resetting config:', error);
    res.status(500).json({
      success: false,
      error: 'Error resetting configuration'
    });
  }
};
