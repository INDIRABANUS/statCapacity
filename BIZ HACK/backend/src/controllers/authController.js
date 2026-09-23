const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Donor = require('../models/Donor');

// Helper to generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'bizhack_secret_jwt_key_2026_blood_donor_app',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user / donor
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'DONOR', bloodGroup, phone, location, lastDonationDate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // If role is DONOR, validate donor-specific fields
    if (role === 'DONOR') {
      if (!bloodGroup || !phone || !location) {
        return res.status(400).json({
          success: false,
          message: 'Blood group, phone number, and location are required for donor registration',
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role === 'ADMIN' ? 'ADMIN' : 'DONOR',
      status: 'ACTIVE',
    });

    let donor = null;
    if (user.role === 'DONOR') {
      donor = await Donor.create({
        userId: user._id,
        name: user.name,
        bloodGroup: bloodGroup.toUpperCase(),
        phone,
        email: user.email,
        location,
        availability: 'AVAILABLE',
        status: 'ACTIVE',
        lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      donor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    let donor = null;
    if (user.role === 'DONOR') {
      donor = await Donor.findOne({ userId: user._id });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      donor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Protected
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let donor = null;

    if (user.role === 'DONOR') {
      donor = await Donor.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user,
      donor,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
