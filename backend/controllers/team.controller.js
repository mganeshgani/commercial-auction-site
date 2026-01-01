const Team = require('../models/team.model');
const Player = require('../models/player.model');
const cloudinary = require('../config/cloudinary');

// Create new team
exports.createTeam = async (req, res) => {
  try {
    // Check if auctioneer has reached team limit
    if (req.user.role === 'auctioneer' && req.user.limits && req.user.limits.maxTeams !== null) {
      const currentTeamCount = await Team.countDocuments({ auctioneer: req.user._id });
      if (currentTeamCount >= req.user.limits.maxTeams) {
        return res.status(403).json({
          error: `Team limit reached. Maximum allowed: ${req.user.limits.maxTeams}. Contact admin for upgrade.`
        });
      }
    }

    const { name, totalSlots, budget } = req.body;
    
    // Upload logo to Cloudinary if provided
    let logoUrl = '';
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'team-logos',
              public_id: `team_${name}_${Date.now()}`,
              resource_type: 'image',
              transformation: [
                { width: 200, height: 200, crop: 'fill', gravity: 'auto' },
                { quality: 'auto:eco' },
                { fetch_format: 'auto' }
              ],
              eager: [],
              eager_async: false
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        logoUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Error uploading logo:', uploadError);
      }
    }
    
    const team = new Team({
      name,
      logoUrl,
      totalSlots,
      budget,
      remainingBudget: budget,
      auctioneer: req.user._id // Link team to auctioneer
    });

    await team.save();
    
    // Emit socket event only to this auctioneer's room
    const io = req.app.get('io');
    if (io) {
      io.to(`auctioneer_${req.user._id}`).emit('teamCreated', team);
    }
    
    res.status(201).json(team);
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ error: 'Team name already exists in your auction' });
    }
    res.status(500).json({ error: 'Error creating team' });
  }
};

// Update team
exports.updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const updateData = req.body;

    // Verify team belongs to this auctioneer
    const team = await Team.findOne({ _id: teamId, auctioneer: req.user._id });
    if (!team) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }

    // Handle MongoDB $push operation for adding players
    if (updateData.$push && updateData.$push.players) {
      team.players.push(updateData.$push.players);
      team.filledSlots = team.players.length;
      
      // Deduct soldAmount from remainingBudget if provided
      if (updateData.soldAmount && typeof updateData.soldAmount === 'number') {
        team.remainingBudget = (team.remainingBudget || team.budget) - updateData.soldAmount;
      }
      
      await team.save();
      
      // Emit socket event for real-time updates (only to this auctioneer)
      const io = req.app.get('io');
      if (io) {
        io.to(`auctioneer_${req.user._id}`).emit('teamUpdated', team);
      }
      
      return res.json(team);
    }

    // Regular update fields
    const { name, totalSlots, budget } = updateData;

    // Upload new logo if provided
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'team-logos',
              public_id: `team_${name || team.name}_${Date.now()}`,
              resource_type: 'image',
              transformation: [
                { width: 200, height: 200, crop: 'fill', gravity: 'auto' },
                { quality: 'auto:eco' },
                { fetch_format: 'auto' }
              ],
              eager: [],
              eager_async: false
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        team.logoUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Error uploading logo:', uploadError);
      }
    }

    // Validate total slots
    if (totalSlots && totalSlots < team.filledSlots) {
      return res.status(400).json({ 
        error: 'New total slots cannot be less than current filled slots' 
      });
    }

    // Update fields
    if (name) team.name = name;
    if (totalSlots) team.totalSlots = totalSlots;
    if (budget !== undefined) {
      const spentBudget = team.budget ? (team.budget - (team.remainingBudget || 0)) : 0;
      team.budget = budget;
      team.remainingBudget = budget - spentBudget;
    }

    await team.save();
    
    // Emit socket event for real-time updates (only to this auctioneer)
    const io = req.app.get('io');
    if (io) {
      io.to(`auctioneer_${req.user._id}`).emit('teamUpdated', team);
    }
    
    res.json(team);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Team name already exists in your auction' });
    }
    res.status(500).json({ error: 'Error updating team' });
  }
};

// Delete team
exports.deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // Verify team belongs to this auctioneer
    const team = await Team.findOne({ _id: teamId, auctioneer: req.user._id });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }

    // Check if team has players
    if (team.filledSlots > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete team with assigned players' 
      });
    }

    await team.deleteOne();
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting team' });
  }
};

// Get all teams
exports.getAllTeams = async (req, res) => {
  try {
    // OPTIMIZED: Only populate necessary fields, not full player objects
    // Filter by logged-in auctioneer
    const teams = await Team.find({ auctioneer: req.user._id })
      .populate('players', 'name regNo class position soldAmount') // Only specific fields
      .lean(); // Return plain objects (faster)
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching teams' });
  }
};

// Get team by ID
exports.getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;
    // Filter by logged-in auctioneer
    const team = await Team.findOne({ 
      _id: teamId,
      auctioneer: req.user._id 
    })
      .populate('players', 'name regNo class position soldAmount')
      .lean();
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching team' });
  }
};

// Get final results
exports.getFinalResults = async (req, res) => {
  try {
    // Filter by logged-in auctioneer
    const teams = await Team.find({ auctioneer: req.user._id })
      .populate('players', 'name regNo class position soldAmount')
      .sort('name')
      .lean();

    const results = teams.map(team => ({
      teamName: team.name,
      totalPlayers: team.filledSlots,
      totalSlots: team.totalSlots,
      budget: team.budget,
      remainingBudget: team.remainingBudget,
      players: team.players.map(player => ({
        name: player.name,
        regNo: player.regNo,
        class: player.class,
        position: player.position,
        soldAmount: player.soldAmount
      }))
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching final results' });
  }
};

// Delete all teams (for auction reset)
exports.deleteAllTeams = async (req, res) => {
  try {
    // Only delete teams belonging to the logged-in auctioneer
    const result = await Team.deleteMany({ auctioneer: req.user._id });
    
    // Emit socket event for real-time updates (only to this auctioneer)
    const io = req.app.get('io');
    if (io) {
      io.to(`auctioneer_${req.user._id}`).emit('dataReset');
    }
    
    res.json({ 
      message: 'All teams deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting all teams' });
  }
};