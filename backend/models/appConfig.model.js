const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
  auctioneer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  branding: {
    title: {
      type: String,
      default: 'SPORTS AUCTION',
      maxlength: 50
    },
    subtitle: {
      type: String,
      default: 'St Aloysius (Deemed To Be University)',
      maxlength: 100
    },
    logoUrl: {
      type: String,
      default: ''
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field before saving
appConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AppConfig', appConfigSchema);
