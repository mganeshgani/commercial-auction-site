const User = require('../models/user.model');
const { generateToken } = require('../middleware/auth.middleware');
const crypto = require('crypto');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

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

    // Create user (everyone is auctioneer by default, only you are admin)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'auctioneer' // Default to auctioneer
    });

    // Generate token
    const token = generateToken(user._id);

    // Send response with cookie
    res.status(201)
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })
      .json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token
        }
      });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error registering user'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Find user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Validate password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Send response with cookie
    res.status(200)
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })
      .json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin
          },
          token
        }
      });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error logging in'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.status(200)
      .cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
        httpOnly: true
      })
      .json({
        success: true,
        data: {}
      });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error logging out'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching user data'
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating user details'
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(req.body.currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.status(200)
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .json({
        success: true,
        data: { token }
      });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating password'
    });
  }
};

// @desc    Generate registration link for auctioneer
// @route   POST /api/auth/generate-registration-link
// @access  Private (Auctioneer/Admin only)
exports.generateRegistrationLink = async (req, res) => {
  try {
    console.log('🔗 Generate registration link request');
    console.log('User from req:', req.user);
    
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('✓ User found:', user.name, 'Role:', user.role);

    // Check if user is auctioneer or admin
    if (user.role !== 'auctioneer' && user.role !== 'admin') {
      console.log('❌ Unauthorized role:', user.role);
      return res.status(403).json({
        success: false,
        error: 'Only auctioneers and admins can generate registration links'
      });
    }

    // Generate or reuse existing token
    if (!user.registrationToken) {
      user.registrationToken = crypto.randomBytes(32).toString('hex');
      await user.save();
      console.log('✓ New token generated');
    } else {
      console.log('✓ Reusing existing token');
    }

    // Create registration URL
    const registrationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/player-registration/${user.registrationToken}`;

    console.log('✓ Registration URL created:', registrationUrl);

    res.status(200).json({
      success: true,
      data: {
        token: user.registrationToken,
        url: registrationUrl,
        message: 'Share this link with players to register for your auction'
      }
    });
  } catch (error) {
    console.error('❌ Generate registration link error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error generating registration link'
    });
  }
};

// @desc    Get registration link info
// @route   GET /api/auth/registration-link/:token
// @access  Public
exports.getRegistrationLinkInfo = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ registrationToken: token }).select('name email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired registration link'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        auctioneerName: user.name,
        auctioneerEmail: user.email,
        isValid: true
      }
    });
  } catch (error) {
    console.error('Get registration link info error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching registration link info'
    });
  }
};
