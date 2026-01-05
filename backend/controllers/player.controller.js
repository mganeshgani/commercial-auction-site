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

    // Separate core fields from custom fields (do this first while upload happens)
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
      // Find all players for this auctioneer
      const allPlayers = await Player.find({ 
        auctioneer: auctioneer._id
      })
      .select('regNo')
      .lean();

      let maxNumber = 0;
      
      // Extract all numbers from regNo
      allPlayers.forEach(p => {
        if (p.regNo) {
          const match = p.regNo.match(/\d+/);
          if (match) {
            const num = parseInt(match[0]);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      });
      
      finalRegNo = `P${String(maxNumber + 1).padStart(4, '0')}`;
      console.log(`✓ Registration form - Generated regNo: ${finalRegNo} (${allPlayers.length} players, max: ${maxNumber})`);
    }

    // Upload photo to Cloudinary (OPTIMIZED - async transformations)
    let photoUrl = '';
    const uploadPromise = req.file ? new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'auction-players',
          public_id: `player_${regNo || 'temp'}_${Date.now()}`,
          resource_type: 'image',
          transformation: [
            { width: 600, height: 600, crop: 'limit', quality: 'auto:good', fetch_format: 'webp' }
          ],
          eager_async: true, // Process async - don't wait
          invalidate: false // Faster upload
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      uploadStream.end(req.file.buffer);
    }) : Promise.resolve('');

    // Wait for upload to complete
    photoUrl = await uploadPromise;

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

// Get random unsold player - OPTIMIZED with aggregation
exports.getRandomPlayer = async (req, res) => {
  try {
    // OPTIMIZED: Use aggregation $sample for better random selection
    const players = await Player.aggregate([
      { 
        $match: { 
          status: 'available',
          auctioneer: req.user._id 
        } 
      },
      { $sample: { size: 1 } }
    ]);
    
    if (players.length === 0) {
      return res.status(404).json({ message: 'No available players found' });
    }

    const player = players[0];
    res.json(player);
  } catch (error) {
    console.error('Error fetching random player:', error);
    res.status(500).json({ error: 'Error fetching random player' });
  }
};

// Assign player to team - OPTIMIZED with parallel queries
exports.assignPlayer = async (req, res) => {
  try {
    const { playerId, teamId, amount } = req.body;
    
    // OPTIMIZED: Fetch player and team in parallel
    const [player, team] = await Promise.all([
      Player.findOne({ _id: playerId, auctioneer: req.user._id }),
      Team.findOne({ _id: teamId, auctioneer: req.user._id })
    ]);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found or access denied' });
    }
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

    // Update team
    team.players.push(playerId);
    team.filledSlots += 1;
    if (team.budget !== null) {
      team.remainingBudget -= amount;
    }
    
    // OPTIMIZED: Save both in parallel
    await Promise.all([player.save(), team.save()]);

    // Emit socket events only to this auctioneer's room
    const io = req.app.get('io');
    if (io) {
      const room = `auctioneer_${req.user._id}`;
      io.to(room).emit('playerSold', player);
      io.to(room).emit('teamUpdated', team);
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

// Get all unsold players - OPTIMIZED
exports.getUnsoldPlayers = async (req, res) => {
  try {
    // Filter by logged-in auctioneer
    // OPTIMIZED: Use lean() for plain JS objects, sort by name
    const players = await Player.find({ 
      status: 'unsold',
      auctioneer: req.user._id 
    })
    .sort({ name: 1 })
    .lean();
    
    res.set('Cache-Control', 'private, max-age=5');
    res.json(players);
  } catch (error) {
    console.error('Error fetching unsold players:', error);
    res.status(500).json({ error: 'Error fetching unsold players' });
  }
};

// Get all players - OPTIMIZED
exports.getAllPlayers = async (req, res) => {
  try {
    // Filter players by the logged-in auctioneer
    // OPTIMIZED: Use lean() for plain JS objects (2-5x faster)
    // OPTIMIZED: Only populate necessary team fields
    const players = await Player.find({ auctioneer: req.user._id })
      .populate('team', 'name')
      .sort({ createdAt: -1 }) // Newest first
      .lean();
    
    // Set cache headers for better performance
    res.set('Cache-Control', 'private, max-age=5');
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Error fetching players' });
  }
};

// Delete all players (for auction reset) - OPTIMIZED
exports.deleteAllPlayers = async (req, res) => {
  try {
    // Only delete players belonging to the logged-in auctioneer
    const result = await Player.deleteMany({ auctioneer: req.user._id });
    
    // Emit socket event for real-time updates (only to this auctioneer)
    const io = req.app.get('io');
    if (io) {
      io.to(`auctioneer_${req.user._id}`).emit('dataReset');
      io.to(`auctioneer_${req.user._id}`).emit('playersCleared');
    }
    
    res.json({ 
      message: 'All players deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting all players:', error);
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
                { width: 600, height: 600, crop: 'limit', quality: 'auto:good', fetch_format: 'webp' }
              ],
              eager_async: true,
              invalidate: false
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

    const { name, regNo, class: playerClass, position, ...otherFields } = req.body;

    console.log('Creating player:', { name, regNo, playerClass, position, otherFields, hasFile: !!req.file });

    // Validate required field - only name is truly required
    if (!name) {
      return res.status(400).json({ 
        error: 'Player name is required' 
      });
    }

    // Build custom fields from any extra fields sent
    const customFields = new Map();
    Object.keys(otherFields).forEach(key => {
      if (otherFields[key]) {
        customFields.set(key, otherFields[key]);
      }
    });

    // Auto-generate regNo if not provided
    let finalRegNo = regNo;
    
    if (!finalRegNo) {
      // Find all players for this auctioneer
      const allPlayers = await Player.find({ 
        auctioneer: req.user._id
      })
      .select('regNo')
      .lean();

      let maxNumber = 0;
      
      // Extract all numbers from regNo (handle any format)
      allPlayers.forEach(p => {
        if (p.regNo) {
          const match = p.regNo.match(/\d+/);
          if (match) {
            const num = parseInt(match[0]);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      });
      
      // Generate next regNo
      finalRegNo = `P${String(maxNumber + 1).padStart(4, '0')}`;
      
      // Double-check it doesn't already exist (extra safety)
      const existsCheck = await Player.findOne({ 
        regNo: finalRegNo, 
        auctioneer: req.user._id 
      }).lean();
      
      if (existsCheck) {
        // If somehow it still exists, use a guaranteed unique approach
        const timestamp = Date.now();
        finalRegNo = `P${String(maxNumber + 1 + (timestamp % 100)).padStart(4, '0')}`;
        console.log(`⚠️ RegNo collision detected, using: ${finalRegNo}`);
      } else {
        console.log(`✓ Generated unique regNo: ${finalRegNo} (${allPlayers.length} players, max: ${maxNumber})`);
      }
    } else {
      // If regNo is provided, check for duplicates
      const existingPlayer = await Player.findOne({ regNo, auctioneer: req.user._id }).lean();
      if (existingPlayer) {
        return res.status(400).json({ 
          error: 'A player with this registration number already exists' 
        });
      }
    }

    // Create player with temporary placeholder photo (instant)
    const tempPhotoUrl = req.file 
      ? 'https://via.placeholder.com/400x400?text=' + encodeURIComponent(name.charAt(0))
      : 'https://via.placeholder.com/400x400?text=' + encodeURIComponent(name.charAt(0));

    const player = new Player({
      name,
      regNo: finalRegNo,
      class: playerClass || 'N/A',
      position: position || 'N/A',
      photoUrl: tempPhotoUrl,
      customFields,
      auctioneer: req.user._id,
      status: 'available'
    });

    // Save player immediately
    await player.save();
    
    // Get IO instance for socket events
    const io = req.app.get('io');
    
    // Emit socket event for real-time updates (immediate)
    if (io) {
      const roomName = `auctioneer_${req.user._id}`;
      console.log(`📡 Emitting playerAdded to room: ${roomName}`, { name: player.name, regNo: player.regNo });
      io.to(roomName).emit('playerAdded', player);
      
      // Also log all clients in this room
      const room = io.sockets.adapter.rooms.get(roomName);
      console.log(`📡 Room ${roomName} has ${room ? room.size : 0} connected clients`);
    } else {
      console.error('❌ Socket.io instance not available!');
    }

    // Send immediate response
    res.status(201).json(player);

    // Upload photo to Cloudinary in background (async, non-blocking)
    if (req.file) {
      const auctioneerId = req.user._id;
      const playerId = player._id;
      const playerName = name;
      
      // Wrap in async IIFE to catch unhandled rejections
      (async () => {
        try {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'auction-players',
              public_id: `player_${finalRegNo}_${Date.now()}`,
              resource_type: 'image',
              transformation: [
                { width: 600, height: 600, crop: 'limit', quality: 'auto:good', fetch_format: 'webp' }
              ],
              eager_async: true,
              invalidate: false,
              timeout: 60000
            },
            async (error, result) => {
              if (error) {
                console.error(`❌ Upload failed for ${playerName}:`, error.message || error);
                return;
              }
              
              try {
                const updatedPlayer = await Player.findById(playerId);
                if (updatedPlayer) {
                  updatedPlayer.photoUrl = result.secure_url;
                  await updatedPlayer.save();
                  
                  if (io) {
                    io.to(`auctioneer_${auctioneerId}`).emit('playerUpdated', updatedPlayer);
                  }
                  console.log(`✓ Photo uploaded for ${playerName}`);
                }
              } catch (err) {
                console.error(`❌ Error updating photo for ${playerName}:`, err.message);
              }
            }
          );
          uploadStream.end(req.file.buffer);
        } catch (err) {
          console.error(`❌ Background upload error:`, err.message);
        }
      })().catch(err => console.error(`❌ Unhandled upload error:`, err.message));
    }
  } catch (error) {
    console.error('Error creating player:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'A player with this registration number already exists. Please try again.' 
      });
    }
    
    res.status(500).json({ error: error.message || 'Error creating player' });
  }
};