const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logoUrl: {
    type: String,
    default: ''
  },
  totalSlots: {
    type: Number,
    required: true,
    min: 1
  },
  filledSlots: {
    type: Number,
    default: 0
  },
  budget: {
    type: Number,
    default: null
  },
  remainingBudget: {
    type: Number,
    default: null
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  auctioneer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index: team names must be unique per auctioneer (not globally)
teamSchema.index({ name: 1, auctioneer: 1 }, { unique: true });
// Index for faster auctioneer-based queries
teamSchema.index({ auctioneer: 1 });
// Compound index for auctioneer + sorting
teamSchema.index({ auctioneer: 1, createdAt: -1 });
teamSchema.index({ auctioneer: 1, name: 1 });

// Virtual for available slots
teamSchema.virtual('availableSlots').get(function() {
  return this.totalSlots - this.filledSlots;
});

// Middleware to check if team can add more players
teamSchema.methods.canAddPlayer = function() {
  return this.filledSlots < this.totalSlots;
};

// Middleware to check if team has enough budget
teamSchema.methods.hasEnoughBudget = function(amount) {
  if (this.budget === null) return true; // No budget restriction
  return this.remainingBudget >= amount;
};

module.exports = mongoose.model('Team', teamSchema);