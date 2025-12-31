const User = require('../models/user.model');
const Player = require('../models/player.model');
const Team = require('../models/team.model');

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
          currentPlayers: playerCount,
          currentTeams: teamCount
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
        currentPlayers: playerCount,
        currentTeams: teamCount
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
