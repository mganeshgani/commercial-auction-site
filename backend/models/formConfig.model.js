const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true
  },
  fieldLabel: {
    type: String,
    required: true
  },
  fieldType: {
    type: String,
    enum: ['text', 'number', 'select', 'file', 'textarea', 'date', 'email', 'tel'],
    required: true
  },
  required: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  options: [{
    type: String
  }], // For select fields
  order: {
    type: Number,
    required: true
  },
  validation: {
    minLength: Number,
    maxLength: Number,
    min: Number,
    max: Number,
    pattern: String
  }
});

const formConfigSchema = new mongoose.Schema({
  auctioneer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sportType: {
    type: String,
    required: true,
    default: 'general'
  },
  formTitle: {
    type: String,
    default: 'Player Registration'
  },
  formDescription: {
    type: String,
    default: 'Fill in your details to register for the auction'
  },
  fields: [fieldSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster auctioneer queries
formConfigSchema.index({ auctioneer: 1 });

// Update timestamp on save
formConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FormConfig', formConfigSchema);
