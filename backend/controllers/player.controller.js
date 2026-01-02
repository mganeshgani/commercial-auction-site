const Player = require('../models/player.model');
const Team = require('../models/team.model');
const User = require('../models/user.model');
const cloudinary = require('../config/cloudinary');

// Register a new player with photo (via registration link)
exports.registerPlayer = async (req, res) => {
  try {
    const { name, regNo, token, ...customFieldsData } = req.body;

    // Validate required fields
    if (!name || !token) {
      return res.status(400).json({ 
        error: 'Name and token are required' 
      });
    }

    // Find auctioneer by registration token
    const auctioneer = await User.findOne({ registrationToken: token });
    if (!auctioneer) {
      return res.status(400).json({ 
        error: 'Invalid registration link. Please contact the organizer.' 
      });
    }

    // Check if registration number already exists for this auctioneer (only if provided)
    if (regNo) {
      const existingPlayer = await Player.findOne({ 
        regNo, 
        auctioneer: auctioneer._id 
      });
      
      if (existingPlayer) {
        return res.status(400).json({ 
          error: 'A player with this registration number already exists for this auction' 
        });
      }
    }

    // Upload photo to Cloudinary
    let photoUrl = '';
    if (req.file) {
      try {
        // Upload buffer to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'auction-players',
              public_id: `player_${regNo}_${Date.now()}`,
              resource_type: 'image',
              transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto' },
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
        
        photoUrl = result.secure_url;
        console.log('✓ Photo uploaded to Cloudinary:', photoUrl);
      } catch (uploadError) {
        console.error('❌ Cloudinary upload error:', uploadError);
        return res.status(400).json({ 
          error: 'Failed to upload photo. Please try again.' 
        });
      }
    }

    // Separate core fields from custom fields
    const { class: playerClass, position } = customFieldsData;
    
    // Build custom fields map (exclude core fields)
    const customFields = new Map();
    Object.keys(customFieldsData).forEach(key => {
      if (!['class', 'position', 'photo'].includes(key)) {
        customFields.set(key, customFieldsData[key]);
      }
    });

    // Auto-generate regNo if not provided
    let finalRegNo = regNo;
    if (!finalRegNo) {
      const playerCount = await Player.countDocuments({ auctioneer: auctioneer._id });
      finalRegNo = `P${String(playerCount + 1).padStart(4, '0')}`; // P0001, P0002, etc.
    }

    // Create new player linked to auctioneer
    const player = new Player({
      name,
      regNo: finalRegNo,
      class: playerClass || 'N/A',
      position: position || 'N/A',
      photoUrl,
      customFields,
      status: 'available',
      auctioneer: auctioneer._id
    });

    await player.save();

    // Emit socket event for real-time updates (only to this auctioneer's room)
    if (req.app.get('io')) {
      req.app.get('io').to(`auctioneer_${auctioneer._id}`).emit('playerAdded', player);
    }

    res.status(201).json({
      message: 'Player registered successfully',
      player,
      auctioneerName: auctioneer.name
    });

  } catch (error) {
    console.error('Error registering player:', error);
    res.status(500).json({ error: 'Error registering player: ' + error.message });
  }
};

// Get random unsold player
exports.getRandomPlayer = async (req, res) => {
  try {
    // Filter by logged-in auctioneer
    const count = await Player.countDocuments({ 
      status: 'available',
      auctioneer: req.user._id 
    });
    if (count === 0) {
      return res.status(404).json({ message: 'No available players found' });
    }

    const random = Math.floor(Math.random() * count);
    const player = await Player.findOne({ 
      status: 'available',
      auctioneer: req.user._id 
    }).skip(random);
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching random player' });
  }
};

// Assign player to team
exports.assignPlayer = async (req, res) => {
  try {
    const { playerId, teamId, amount } = req.body;
    
    // Verify player belongs to this auctioneer
    const player = await Player.findOne({ _id: playerId, auctioneer: req.user._id });
    if (!player) {
      return res.status(404).json({ error: 'Player not found or access denied' });
    }

    // Verify team belongs to this auctioneer
    const team = await Team.findOne({ _id: teamId, auctioneer: req.user._id });
    if (!team) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }

    // Check if team has available slots
    if (!team.canAddPlayer()) {
      return res.status(400).json({ error: 'Team has no available slots' });
    }

    // Check if team has enough budget
    if (!team.hasEnoughBudget(amount)) {
      return res.status(400).json({ error: 'Team does not have enough budget' });
    }

    // Update player
    player.status = 'sold';
    player.team = teamId;
    player.soldAmount = amount;
    await player.save();

    // Update team
    team.players.push(playerId);
    team.filledSlots += 1;
    if (team.budget !== null) {
      team.remainingBudget -= amount;
    }
    await team.save();

    // Emit socket events only to this auctioneer's room
    const io = req.app.get('io');
    if (io) {
      io.to(`auctioneer_${req.user._id}`).emit('playerSold', player);
      io.to(`auctioneer_${req.user._id}`).emit('teamUpdated', team);
    }

    res.json({ message: 'Player assigned successfully', player, team });
  } catch (error) {
    res.status(500).json({ error: 'Error assigning player' });
  }
};

// Mark player as unsold
exports.markUnsold = async (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Verify player belongs to this auctioneer
    const player = await Player.findOne({ _id: playerId, auctioneer: req.user._id });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found or access denied' });
    }

    player.status = 'unsold';
    await player.save();

    // Emit socket event for real-time updates (only to this auctioneer)
    const io = req.app.get('io');
    if (io) {
      io.to(`auctioneer_${req.user._id}`).emit('playerMarkedUnsold', player);
      io.to(`auctioneer_${req.user._id}`).emit('playerUpdated', player);
    }

    res.json({ message: 'Player marked as unsold', player });
  } catch (error) {
    res.status(500).json({ error: 'Error marking player as unsold' });
  }
};

// Get all unsold players
exports.getUnsoldPlayers = async (req, res) => {
  try {
    // Filter by logged-in auctioneer
    const players = await Player.find({ 
      status: 'unsold',
      auctioneer: req.user._id 
    });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching unsold players' });
  }
};

// Get all players
exports.getAllPlayers = async (req, res) => {
  try {
    // Filter players by the logged-in auctioneer
    const players = await Player.find({ auctioneer: req.user._id }).populate('team', 'name');
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching players' });
  }
};

// Delete all players (for auction reset)
exports.deleteAllPlayers = async (req, res) => {
  try {
    // Only delete players belonging to the logged-in auctioneer
    const result = await Player.deleteMany({ auctioneer: req.user._id });
    
    // Emit socket event for real-time updates (only to this auctioneer)
    const io = req.app.get('io');
    if (io) {
      io.to(`auctioneer_${req.user._id}`).emit('dataReset');
    }
    
    res.json({ 
      message: 'All players deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting all players' });
  }
};

// Remove player from team
exports.removePlayerFromTeam = async (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Verify player belongs to this auctioneer
    const player = await Player.findOne({ _id: playerId, auctioneer: req.user._id });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found or access denied' });
    }

    console.log('Remove player from team - Player data:', {
      id: player._id,
      name: player.name,
      team: player.team,
      status: player.status,
      soldAmount: player.soldAmount
    });

    let teamId = player.team;
    let soldAmount = player.soldAmount || 0;
    let team = null;

    // If player has a team field, use it
    if (teamId) {
      team = await Team.findOne({ _id: teamId, auctioneer: req.user._id });
    } else {
      // Data inconsistency: player.team is null but player might be in a team's array
      // Search all teams to find which one has this player
      console.log('Player team field is null - searching all teams for this player');
      team = await Team.findOne({ 
        auctioneer: req.user._id,
        players: playerId 
      });
      
      if (!team) {
        return res.status(400).json({ error: 'Player is not assigned to any team' });
      }
      
      console.log(`Found player in team: ${team.name} (${team._id})`);
    }

    // Remove player from team's players array and update budget
    if (team) {
      // Remove player from team's players array
      team.players = team.players.filter(p => String(p) !== String(playerId));
      team.filledSlots = team.players.length;
      
      // Refund the sold amount to team's budget (only if player was sold)
      if (player.status === 'sold' && soldAmount > 0) {
        team.remainingBudget = (team.remainingBudget || 0) + soldAmount;
      }
      
      await team.save();
      
      // Emit socket event for team update (only to this auctioneer)
      const io = req.app.get('io');
      if (io) {
        io.to(`auctioneer_${req.user._id}`).emit('teamUpdated', team);
      }
    }

    // Update player to available status
    player.status = 'available';
    player.team = null;
    player.soldAmount = null;
    await player.save();

    // Emit socket events for real-time updates (only to this auctioneer)
    const io = req.app.get('io');
    if (io) {
      io.to(`auctioneer_${req.user._id}`).emit('playerUpdated', player);
      io.to(`auctioneer_${req.user._id}`).emit('playerRemovedFromTeam', { player, team });
    }

    res.json({ 
      message: 'Player removed from team successfully', 
      player,
      team 
    });
  } catch (error) {
    console.error('Error removing player from team:', error);
    res.status(500).json({ error: 'Error removing player from team' });
  }
};

// Update player (PATCH)
exports.updatePlayer = async (req, res) => {
  try {
    const { playerId } = req.params;
    const updateData = req.body;

    // Verify player belongs to this auctioneer
    const player = await Player.findOne({ _id: playerId, auctioneer: req.user._id });
    if (!player) {
      return res.status(404).json({ error: 'Player not found or access denied' });
    }

    const oldTeam = player.team;
    const oldStatus = player.status;
    const oldSoldAmount = player.soldAmount || 0;
    const newTeam = updateData.team;
    const newStatus = updateData.status;

    // Handle photo upload if provided
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'auction-players',
              public_id: `player_${player.regNo || playerId}_${Date.now()}`,
              resource_type: 'image',
              transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto' },
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
        
        player.photoUrl = result.secure_url;
        console.log('Photo updated:', result.secure_url);
      } catch (uploadError) {
        console.error('Error uploading photo:', uploadError);
        return res.status(400).json({ 
          error: 'Failed to upload photo. Please try again.' 
        });
      }
    }

    // Update player fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'photo') { // Skip photo as it's handled separately
        player[key] = updateData[key];
      }
    });

    // If marking as unsold, clear team and soldAmount
    if (updateData.status === 'unsold') {
      player.team = null;
      player.soldAmount = null;
      
      // If player was previously sold, refund the team
      if (oldTeam && oldStatus === 'sold') {
        const team = await Team.findOne({ _id: oldTeam, auctioneer: req.user._id });
        if (team) {
          team.players = team.players.filter(p => String(p) !== String(playerId));
          team.filledSlots = team.players.length;
          team.remainingBudget = (team.remainingBudget || 0) + oldSoldAmount;
          await team.save();
          
          const io = req.app.get('io');
          if (io) {
            io.to(`auctioneer_${req.user._id}`).emit('teamUpdated', team);
          }
        }
      }
    }
    
    // If changing teams or assigning to a team for the first time
    if (updateData.status === 'sold' && updateData.team) {
      const teamChanged = oldTeam && String(oldTeam) !== String(newTeam);
      
      // Remove from old team if changing teams
      if (teamChanged && oldTeam) {
        const oldTeamDoc = await Team.findOne({ _id: oldTeam, auctioneer: req.user._id });
        if (oldTeamDoc) {
          oldTeamDoc.players = oldTeamDoc.players.filter(p => String(p) !== String(playerId));
          oldTeamDoc.filledSlots = oldTeamDoc.players.length;
          // Refund old amount to old team
          oldTeamDoc.remainingBudget = (oldTeamDoc.remainingBudget || 0) + oldSoldAmount;
          await oldTeamDoc.save();
          
          const io = req.app.get('io');
          if (io) {
            io.to(`auctioneer_${req.user._id}`).emit('teamUpdated', oldTeamDoc);
          }
        }
      }
      
      // Add to new team
      const team = await Team.findOne({ _id: updateData.team, auctioneer: req.user._id });
      if (!team) {
        return res.status(404).json({ error: 'Team not found or access denied' });
      }
      
      // Check if player is already in team's players array
      const playerExists = team.players.some(p => String(p) === String(playerId));
      if (!playerExists) {
        team.players.push(playerId);
        team.filledSlots = team.players.length;
      }
      
      // Deduct soldAmount from new team budget if provided
      if (updateData.soldAmount && typeof updateData.soldAmount === 'number') {
        // Only deduct if it's a new assignment or team change
        if (!oldTeam || teamChanged) {
          team.remainingBudget = (team.remainingBudget || team.budget) - updateData.soldAmount;
        }
      }
      
      await team.save();
      
      const io = req.app.get('io');
      if (io) {
        io.to(`auctioneer_${req.user._id}`).emit('teamUpdated', team);
      }
    }

    await player.save();
    
    // Emit socket event for real-time updates (only to this auctioneer)
    const io = req.app.get('io');
    if (io) {
      io.to(`auctioneer_${req.user._id}`).emit('playerUpdated', player);
      if (updateData.status === 'unsold') {
        io.to(`auctioneer_${req.user._id}`).emit('playerMarkedUnsold', player);
      }
      if (updateData.status === 'sold') {
        io.to(`auctioneer_${req.user._id}`).emit('playerSold', player);
      }
    }
    
    res.json(player);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Error updating player' });
  }
};

// Delete single player
exports.deletePlayer = async (req, res) => {
  try {
    const { playerId } = req.params;

    // Verify player belongs to this auctioneer
    const player = await Player.findOne({ _id: playerId, auctioneer: req.user._id });
    if (!player) {
      return res.status(404).json({ error: 'Player not found or access denied' });
    }

    // If player is assigned to a team, remove them from the team
    if (player.team && player.status === 'sold') {
      const teamId = player.team;
      const soldAmount = player.soldAmount || 0;

      const team = await Team.findOne({ _id: teamId, auctioneer: req.user._id });
      if (team) {
        // Remove player from team's players array
        team.players = team.players.filter(p => String(p) !== String(playerId));
        team.filledSlots = team.players.length;
        
        // Refund the sold amount to team's budget
        team.remainingBudget = (team.remainingBudget || 0) + soldAmount;
        
        await team.save();
        
        // Emit socket event for team update
        const io = req.app.get('io');
        if (io) {
          io.to(`auctioneer_${req.user._id}`).emit('teamUpdated', team);
        }
      }
    }

    // Delete the player
    await Player.deleteOne({ _id: playerId });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`auctioneer_${req.user._id}`).emit('playerDeleted', { playerId });
    }

    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Error deleting player' });
  }
};

// Create player from admin panel
exports.createPlayer = async (req, res) => {
  try {
    // Check if auctioneer has reached player limit
    if (req.user.role === 'auctioneer' && req.user.limits && req.user.limits.maxPlayers !== null) {
      const currentPlayerCount = await Player.countDocuments({ auctioneer: req.user._id });
      if (currentPlayerCount >= req.user.limits.maxPlayers) {
        return res.status(403).json({
          error: `Player limit reached. Maximum allowed: ${req.user.limits.maxPlayers}. Contact admin for upgrade.`
        });
      }
    }

    const { name, regNo, class: playerClass, position } = req.body;

    console.log('Creating player:', { name, regNo, playerClass, position, hasFile: !!req.file });

    // Validate required fields
    if (!name || !playerClass || !position) {
      return res.status(400).json({ 
        error: 'Name, class, and position are required' 
      });
    }

    // Check if registration number already exists for this auctioneer (only if provided)
    if (regNo) {
      const existingPlayer = await Player.findOne({ 
        regNo, 
        auctioneer: req.user._id 
      });
      
      if (existingPlayer) {
        return res.status(400).json({ 
          error: 'A player with this registration number already exists' 
        });
      }
    }

    // Auto-generate regNo if not provided
    let finalRegNo = regNo;
    if (!finalRegNo) {
      const playerCount = await Player.countDocuments({ auctioneer: req.user._id });
      finalRegNo = `P${String(playerCount + 1).padStart(4, '0')}`; // P0001, P0002, etc.
    }

    // Upload photo to Cloudinary if provided
    let photoUrl = '';
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'auction-players',
              public_id: `player_${finalRegNo}_${Date.now()}`,
              resource_type: 'image',
              eager: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto:best', fetch_format: 'auto' }
              ],
              eager_async: true, // Process transformations asynchronously
              overwrite: true,
              invalidate: true
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        
        photoUrl = result.secure_url;
        console.log('Photo uploaded:', photoUrl);
      } catch (uploadError) {
        console.error('Error uploading photo:', uploadError);
        return res.status(400).json({ 
          error: 'Failed to upload photo. Please try again.' 
        });
      }
    } else {
      // Use a default placeholder if no photo provided
      photoUrl = 'https://via.placeholder.com/400x400?text=' + encodeURIComponent(name.charAt(0));
    }

    // Create new player
    const player = new Player({
      name,
      regNo: finalRegNo,
      class: playerClass,
      position,
      photoUrl,
      auctioneer: req.user._id,
      status: 'available'
    });

    // Save player and upload photo in parallel
    const savePromise = player.save();
    
    // Emit socket event immediately for real-time updates (optimistic)
    const io = req.app.get('io');
    if (io) {
      io.to(`auctioneer_${req.user._id}`).emit('playerAdded', player);
    }

    await savePromise;
    console.log('Player created successfully:', player._id);

    res.status(201).json(player);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: error.message || 'Error creating player' });
  }
};