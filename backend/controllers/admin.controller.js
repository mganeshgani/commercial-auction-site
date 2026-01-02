const User = require('../models/user.model');
const Player = require('../models/player.model');
const Team = require('../models/team.model');
const FormConfig = require('../models/formConfig.model');
const cloudinary = require('../config/cloudinary');

// @desc    Create new auctioneer account
// @route   POST /api/admin/auctioneers/create
// @access  Admin only
exports.createAuctioneer = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create auctioneer
    const auctioneer = await User.create({
      name,
      email,
      password,
      role: 'auctioneer',
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: {
        id: auctioneer._id,
        name: auctioneer.name,
        email: auctioneer.email,
        role: auctioneer.role,
        isActive: auctioneer.isActive
      },
      message: 'Auctioneer created successfully'
    });
  } catch (error) {
    console.error('Error creating auctioneer:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error creating auctioneer'
    });
  }
};

// @desc    Get all auctioneers with their stats
// @route   GET /api/admin/auctioneers
// @access  Admin only
exports.getAllAuctioneers = async (req, res) => {
  try {
    // Get all auctioneers (exclude admins)
    const auctioneers = await User.find({ role: 'auctioneer' })
      .select('-password')
      .sort({ createdAt: -1 });

    // Get stats for each auctioneer
    const auctioneersWithStats = await Promise.all(
      auctioneers.map(async (auctioneer) => {
        const playerCount = await Player.countDocuments({ auctioneer: auctioneer._id });
        const teamCount = await Team.countDocuments({ auctioneer: auctioneer._id });
        
        return {
          ...auctioneer.toObject(),
          usage: {
            totalPlayers: playerCount,
            totalTeams: teamCount,
            totalAuctions: 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: auctioneersWithStats
    });
  } catch (error) {
    console.error('Error fetching auctioneers:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching auctioneers'
    });
  }
};

// @desc    Get single auctioneer details
// @route   GET /api/admin/auctioneers/:id
// @access  Admin only
exports.getAuctioneer = async (req, res) => {
  try {
    const auctioneer = await User.findById(req.params.id).select('-password');
    
    if (!auctioneer) {
      return res.status(404).json({
        success: false,
        error: 'Auctioneer not found'
      });
    }

    // Get detailed stats
    const playerCount = await Player.countDocuments({ auctioneer: auctioneer._id });
    const teamCount = await Team.countDocuments({ auctioneer: auctioneer._id });

    res.json({
      success: true,
      data: {
        ...auctioneer.toObject(),
        usage: {
          totalPlayers: playerCount,
          totalTeams: teamCount,
          totalAuctions: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching auctioneer:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching auctioneer'
    });
  }
};

// @desc    Update auctioneer limits and access
// @route   PUT /api/admin/auctioneers/:id
// @access  Admin only
exports.updateAuctioneer = async (req, res) => {
  try {
    const { isActive, accessExpiry, limits } = req.body;
    
    const auctioneer = await User.findById(req.params.id);
    
    if (!auctioneer) {
      return res.status(404).json({
        success: false,
        error: 'Auctioneer not found'
      });
    }

    // Prevent modifying admin accounts
    if (auctioneer.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot modify admin accounts'
      });
    }

    // Update fields
    if (typeof isActive !== 'undefined') {
      auctioneer.isActive = isActive;
    }

    if (accessExpiry !== undefined) {
      auctioneer.accessExpiry = accessExpiry ? new Date(accessExpiry) : null;
    }

    if (limits) {
      if (limits.maxPlayers !== undefined) {
        auctioneer.limits.maxPlayers = limits.maxPlayers;
      }
      if (limits.maxTeams !== undefined) {
        auctioneer.limits.maxTeams = limits.maxTeams;
      }
      if (limits.maxAuctions !== undefined) {
        auctioneer.limits.maxAuctions = limits.maxAuctions;
      }
    }

    await auctioneer.save();

    res.json({
      success: true,
      data: auctioneer,
      message: 'Auctioneer updated successfully'
    });
  } catch (error) {
    console.error('Error updating auctioneer:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating auctioneer'
    });
  }
};

// @desc    Grant access to auctioneer
// @route   POST /api/admin/auctioneers/:id/grant-access
// @access  Admin only
exports.grantAccess = async (req, res) => {
  try {
    const { days } = req.body; // Number of days to grant access
    
    const auctioneer = await User.findById(req.params.id);
    
    if (!auctioneer || auctioneer.role !== 'auctioneer') {
      return res.status(404).json({
        success: false,
        error: 'Auctioneer not found'
      });
    }

    // Calculate expiry date
    let expiryDate = null;
    if (days && days > 0) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
    }

    auctioneer.isActive = true;
    auctioneer.accessExpiry = expiryDate;

    await auctioneer.save();

    res.json({
      success: true,
      data: auctioneer,
      message: days ? `Access granted for ${days} days` : 'Unlimited access granted'
    });
  } catch (error) {
    console.error('Error granting access:', error);
    res.status(500).json({
      success: false,
      error: 'Error granting access'
    });
  }
};

// @desc    Revoke access from auctioneer
// @route   POST /api/admin/auctioneers/:id/revoke-access
// @access  Admin only
exports.revokeAccess = async (req, res) => {
  try {
    const auctioneer = await User.findById(req.params.id);
    
    if (!auctioneer || auctioneer.role !== 'auctioneer') {
      return res.status(404).json({
        success: false,
        error: 'Auctioneer not found'
      });
    }

    auctioneer.isActive = false;

    await auctioneer.save();

    res.json({
      success: true,
      data: auctioneer,
      message: 'Access revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking access:', error);
    res.status(500).json({
      success: false,
      error: 'Error revoking access'
    });
  }
};

// @desc    Delete auctioneer and all their data
// @route   DELETE /api/admin/auctioneers/:id
// @access  Admin only
exports.deleteAuctioneer = async (req, res) => {
  try {
    const auctioneer = await User.findById(req.params.id);
    
    if (!auctioneer) {
      return res.status(404).json({
        success: false,
        error: 'Auctioneer not found'
      });
    }

    // Prevent deleting admin accounts
    if (auctioneer.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete admin accounts'
      });
    }

    // Delete all associated data
    await Player.deleteMany({ auctioneer: auctioneer._id });
    await Team.deleteMany({ auctioneer: auctioneer._id });
    await User.findByIdAndDelete(auctioneer._id);

    res.json({
      success: true,
      message: 'Auctioneer and all associated data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting auctioneer:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting auctioneer'
    });
  }
};

// @desc    Reset/Delete ALL auctioneer data (players, teams, form configs, photos)
// @route   DELETE /api/admin/auctioneers/:id/reset
// @access  Admin only
exports.resetAuctioneerData = async (req, res) => {
  try {
    const auctioneerId = req.params.id;

    // Verify auctioneer exists
    const auctioneer = await User.findById(auctioneerId);
    if (!auctioneer || auctioneer.role !== 'auctioneer') {
      return res.status(404).json({
        success: false,
        error: 'Auctioneer not found'
      });
    }

    console.log(`🗑️ Starting complete data reset for auctioneer: ${auctioneer.name} (${auctioneer.email})`);

    // 1. Get all players for this auctioneer (to delete their photos)
    const players = await Player.find({ auctioneer: auctioneerId });
    console.log(`📋 Found ${players.length} players to delete`);

    // 2. Get all teams for this auctioneer (to delete their logos)
    const teams = await Team.find({ auctioneer: auctioneerId });
    console.log(`📋 Found ${teams.length} teams to delete`);

    // 3. Delete all player photos from Cloudinary
    let playerPhotosDeleted = 0;
    for (const player of players) {
      if (player.photo && player.photo.includes('cloudinary.com')) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = player.photo.split('/');
          const fileWithExt = urlParts[urlParts.length - 1];
          const publicId = `auction-players/${fileWithExt.split('.')[0]}`;
          
          await cloudinary.uploader.destroy(publicId);
          playerPhotosDeleted++;
        } catch (error) {
          console.error(`⚠️ Failed to delete photo for player ${player.name}:`, error.message);
        }
      }
    }
    console.log(`✅ Deleted ${playerPhotosDeleted} player photos from Cloudinary`);

    // 4. Delete all team logos from Cloudinary
    let teamLogosDeleted = 0;
    for (const team of teams) {
      if (team.logo && team.logo.includes('cloudinary.com')) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = team.logo.split('/');
          const fileWithExt = urlParts[urlParts.length - 1];
          const publicId = `auction-teams/${fileWithExt.split('.')[0]}`;
          
          await cloudinary.uploader.destroy(publicId);
          teamLogosDeleted++;
        } catch (error) {
          console.error(`⚠️ Failed to delete logo for team ${team.name}:`, error.message);
        }
      }
    }
    console.log(`✅ Deleted ${teamLogosDeleted} team logos from Cloudinary`);

    // 5. Delete all database records
    const [deletedPlayers, deletedTeams, deletedFormConfigs] = await Promise.all([
      Player.deleteMany({ auctioneer: auctioneerId }),
      Team.deleteMany({ auctioneer: auctioneerId }),
      FormConfig.deleteMany({ auctioneer: auctioneerId })
    ]);

    console.log(`✅ Database cleanup complete:`);
    console.log(`   - Players deleted: ${deletedPlayers.deletedCount}`);
    console.log(`   - Teams deleted: ${deletedTeams.deletedCount}`);
    console.log(`   - Form configs deleted: ${deletedFormConfigs.deletedCount}`);

    // 6. Reset auctioneer's registration token (force new link generation)
    auctioneer.registrationToken = undefined;
    auctioneer.registrationTokenExpiry = undefined;
    await auctioneer.save();

    // 7. Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`auctioneer_${auctioneerId}`).emit('dataReset', {
        message: 'All your data has been reset by admin'
      });
    }

    res.json({
      success: true,
      data: {
        auctioneerName: auctioneer.name,
        deletedPlayers: deletedPlayers.deletedCount,
        deletedTeams: deletedTeams.deletedCount,
        deletedFormConfigs: deletedFormConfigs.deletedCount,
        deletedPlayerPhotos: playerPhotosDeleted,
        deletedTeamLogos: teamLogosDeleted
      },
      message: `All data for ${auctioneer.name} has been completely reset`
    });
  } catch (error) {
    console.error('❌ Error resetting auctioneer data:', error);
    res.status(500).json({
      success: false,
      error: 'Error resetting auctioneer data'
    });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin only
exports.getDashboardStats = async (req, res) => {
  try {
    const totalAuctioneers = await User.countDocuments({ role: 'auctioneer' });
    const activeAuctioneers = await User.countDocuments({ role: 'auctioneer', isActive: true });
    const totalPlayers = await Player.countDocuments();
    const totalTeams = await Team.countDocuments();

    // Auctioneers with expired access
    const expiredAuctioneers = await User.countDocuments({
      role: 'auctioneer',
      accessExpiry: { $lt: new Date() }
    });

    res.json({
      success: true,
      data: {
        totalAuctioneers,
        activeAuctioneers,
        inactiveAuctioneers: totalAuctioneers - activeAuctioneers,
        expiredAuctioneers,
        totalPlayers,
        totalTeams
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching dashboard stats'
    });
  }
};
