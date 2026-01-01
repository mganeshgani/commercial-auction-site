const FormConfig = require('../models/formConfig.model');

// Sport templates with default fields
const sportTemplates = {
  cricket: {
    sportType: 'cricket',
    formTitle: 'Cricket Player Registration',
    formDescription: 'Register for the cricket auction',
    fields: [
      { fieldName: 'photo', fieldLabel: 'Player Photo', fieldType: 'file', required: true, order: 1 },
      { fieldName: 'name', fieldLabel: 'Player Name', fieldType: 'text', required: true, placeholder: 'Enter full name', order: 2 },
      { fieldName: 'regNo', fieldLabel: 'Registration Number', fieldType: 'text', required: false, placeholder: 'Optional ID', order: 3 },
      { fieldName: 'position', fieldLabel: 'Playing Position', fieldType: 'select', required: true, options: ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'], order: 4 },
      { fieldName: 'class', fieldLabel: 'Class/Category', fieldType: 'text', required: true, placeholder: 'e.g., 10th Grade', order: 5 },
      { fieldName: 'battingStyle', fieldLabel: 'Batting Style', fieldType: 'select', required: false, options: ['Right-hand', 'Left-hand'], order: 6 },
      { fieldName: 'bowlingStyle', fieldLabel: 'Bowling Style', fieldType: 'select', required: false, options: ['Fast', 'Medium', 'Spin', 'N/A'], order: 7 }
    ]
  },
  football: {
    sportType: 'football',
    formTitle: 'Football Player Registration',
    formDescription: 'Register for the football auction',
    fields: [
      { fieldName: 'photo', fieldLabel: 'Player Photo', fieldType: 'file', required: true, order: 1 },
      { fieldName: 'name', fieldLabel: 'Player Name', fieldType: 'text', required: true, placeholder: 'Enter full name', order: 2 },
      { fieldName: 'regNo', fieldLabel: 'Registration Number', fieldType: 'text', required: false, placeholder: 'Optional ID', order: 3 },
      { fieldName: 'position', fieldLabel: 'Position', fieldType: 'select', required: true, options: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'], order: 4 },
      { fieldName: 'class', fieldLabel: 'Class/Category', fieldType: 'text', required: true, placeholder: 'e.g., 10th Grade', order: 5 },
      { fieldName: 'jerseyNumber', fieldLabel: 'Preferred Jersey Number', fieldType: 'number', required: false, placeholder: '1-99', order: 6 },
      { fieldName: 'preferredFoot', fieldLabel: 'Preferred Foot', fieldType: 'select', required: false, options: ['Right', 'Left', 'Both'], order: 7 }
    ]
  },
  basketball: {
    sportType: 'basketball',
    formTitle: 'Basketball Player Registration',
    formDescription: 'Register for the basketball auction',
    fields: [
      { fieldName: 'photo', fieldLabel: 'Player Photo', fieldType: 'file', required: true, order: 1 },
      { fieldName: 'name', fieldLabel: 'Player Name', fieldType: 'text', required: true, placeholder: 'Enter full name', order: 2 },
      { fieldName: 'regNo', fieldLabel: 'Registration Number', fieldType: 'text', required: false, placeholder: 'Optional ID', order: 3 },
      { fieldName: 'position', fieldLabel: 'Position', fieldType: 'select', required: true, options: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'], order: 4 },
      { fieldName: 'class', fieldLabel: 'Class/Category', fieldType: 'text', required: true, placeholder: 'e.g., 10th Grade', order: 5 },
      { fieldName: 'height', fieldLabel: 'Height (cm)', fieldType: 'number', required: false, placeholder: 'e.g., 180', order: 6 },
      { fieldName: 'jerseyNumber', fieldLabel: 'Preferred Jersey Number', fieldType: 'number', required: false, placeholder: '0-99', order: 7 }
    ]
  },
  general: {
    sportType: 'general',
    formTitle: 'Player Registration',
    formDescription: 'Register for the auction',
    fields: [
      { fieldName: 'photo', fieldLabel: 'Player Photo', fieldType: 'file', required: true, order: 1 },
      { fieldName: 'name', fieldLabel: 'Player Name', fieldType: 'text', required: true, placeholder: 'Enter full name', order: 2 },
      { fieldName: 'regNo', fieldLabel: 'Registration Number', fieldType: 'text', required: false, placeholder: 'Optional ID', order: 3 },
      { fieldName: 'position', fieldLabel: 'Position/Role', fieldType: 'text', required: true, placeholder: 'Enter position', order: 4 },
      { fieldName: 'class', fieldLabel: 'Class/Category', fieldType: 'text', required: true, placeholder: 'e.g., 10th Grade', order: 5 }
    ]
  }
};

// Get form configuration for auctioneer
exports.getFormConfig = async (req, res) => {
  try {
    let formConfig = await FormConfig.findOne({ auctioneer: req.user._id });
    
    if (!formConfig) {
      // Create default config if none exists
      formConfig = new FormConfig({
        auctioneer: req.user._id,
        ...sportTemplates.general
      });
      await formConfig.save();
    }
    
    res.json(formConfig);
  } catch (error) {
    console.error('Error fetching form config:', error);
    res.status(500).json({ error: 'Error fetching form configuration' });
  }
};

// Get form configuration by registration token (public)
exports.getFormConfigByToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find user by registration token
    const User = require('../models/user.model');
    const auctioneer = await User.findOne({ registrationToken: token });
    
    if (!auctioneer) {
      return res.status(404).json({ success: false, error: 'Invalid registration link' });
    }
    
    let formConfig = await FormConfig.findOne({ auctioneer: auctioneer._id });
    
    if (!formConfig) {
      // Return default config if none exists
      formConfig = sportTemplates.general;
    }
    
    res.json({ success: true, data: formConfig });
  } catch (error) {
    console.error('Error fetching form config by token:', error);
    res.status(500).json({ success: false, error: 'Error fetching form configuration' });
  }
};

// Save/update form configuration
exports.saveFormConfig = async (req, res) => {
  try {
    const { sportType, formTitle, formDescription, fields } = req.body;
    
    // Validate required fields
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'At least one field is required' });
    }
    
// Ensure name and photo are present
    const hasName = fields.some(f => f.fieldName === 'name');
    const hasPhoto = fields.some(f => f.fieldName === 'photo');

    if (!hasName || !hasPhoto) {
      return res.status(400).json({ 
        error: 'Form must include name and photo fields' 
      });
    }
    
    let formConfig = await FormConfig.findOne({ auctioneer: req.user._id });
    
    if (formConfig) {
      // Update existing config
      formConfig.sportType = sportType || formConfig.sportType;
      formConfig.formTitle = formTitle || formConfig.formTitle;
      formConfig.formDescription = formDescription || formConfig.formDescription;
      formConfig.fields = fields;
    } else {
      // Create new config
      formConfig = new FormConfig({
        auctioneer: req.user._id,
        sportType: sportType || 'general',
        formTitle: formTitle || 'Player Registration',
        formDescription: formDescription || 'Fill in your details to register',
        fields
      });
    }
    
    await formConfig.save();
    
    res.json({ 
      message: 'Form configuration saved successfully',
      formConfig 
    });
  } catch (error) {
    console.error('Error saving form config:', error);
    res.status(500).json({ error: 'Error saving form configuration' });
  }
};

// Load sport template
exports.loadSportTemplate = async (req, res) => {
  try {
    const { sportType } = req.params;
    
    const template = sportTemplates[sportType];
    
    if (!template) {
      return res.status(404).json({ 
        error: 'Template not found',
        availableTemplates: Object.keys(sportTemplates)
      });
    }
    
    let formConfig = await FormConfig.findOne({ auctioneer: req.user._id });
    
    if (formConfig) {
      // Update with template
      formConfig.sportType = template.sportType;
      formConfig.formTitle = template.formTitle;
      formConfig.formDescription = template.formDescription;
      formConfig.fields = template.fields;
    } else {
      // Create new with template
      formConfig = new FormConfig({
        auctioneer: req.user._id,
        ...template
      });
    }
    
    await formConfig.save();
    
    res.json({ 
      message: 'Template loaded successfully',
      formConfig 
    });
  } catch (error) {
    console.error('Error loading template:', error);
    res.status(500).json({ error: 'Error loading template' });
  }
};

// Get available sport templates
exports.getSportTemplates = async (req, res) => {
  try {
    const templates = Object.keys(sportTemplates).map(key => ({
      id: key,
      name: sportTemplates[key].formTitle,
      sportType: sportTemplates[key].sportType,
      fieldCount: sportTemplates[key].fields.length
    }));
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Error fetching templates' });
  }
};
