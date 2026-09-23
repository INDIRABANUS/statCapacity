const Donor = require('../models/Donor');
const User = require('../models/User');

// @desc    Get public donors (STRICTLY ACTIVE + AVAILABLE ONLY)
// @route   GET /api/donors
// @access  Public
const getDonors = async (req, res, next) => {
  try {
    const { bloodGroup, location } = req.query;

    // CRITICAL BUSINESS RULE: Public search returns only ACTIVE + AVAILABLE donors
    const filter = {
      status: 'ACTIVE',
      availability: 'AVAILABLE',
    };

    if (bloodGroup && bloodGroup.trim() !== '' && bloodGroup.toUpperCase() !== 'ALL') {
      // Decode and handle bloodGroup parameter (e.g., O+, A+, etc.)
      const cleanGroup = decodeURIComponent(bloodGroup).trim().toUpperCase();
      filter.bloodGroup = cleanGroup;
    }

    if (location && location.trim() !== '') {
      filter.location = { $regex: location.trim(), $options: 'i' };
    }

    const donors = await Donor.find(filter)
      .sort({ updatedAt: -1, createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: donors.length,
      donors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single donor by ID
// @route   GET /api/donors/:id
// @access  Public / Protected
const getDonorById = async (req, res, next) => {
  try {
    const donor = await Donor.findById(req.params.id).select('-__v');

    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    res.json({
      success: true,
      donor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create donor profile
// @route   POST /api/donors
// @access  Protected (Donor or Admin)
const createDonor = async (req, res, next) => {
  try {
    const { name, bloodGroup, phone, email, location, lastDonationDate } = req.body;

    // Check if donor profile already exists for this user
    const existing = await Donor.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Donor profile already exists for this account' });
    }

    const donor = await Donor.create({
      userId: req.user._id,
      name: name || req.user.name,
      bloodGroup: bloodGroup.toUpperCase(),
      phone,
      email: email || req.user.email,
      location,
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
    });

    res.status(201).json({
      success: true,
      message: 'Donor profile created successfully',
      donor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update donor profile
// @route   PUT /api/donors/:id
// @access  Protected (Owner or Admin)
const updateDonor = async (req, res, next) => {
  try {
    const donor = await Donor.findById(req.params.id);

    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // Check authorization: must be owner or admin
    if (donor.userId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
    }

    const { name, bloodGroup, phone, location, lastDonationDate } = req.body;

    if (name) donor.name = name;
    if (bloodGroup) donor.bloodGroup = bloodGroup.toUpperCase();
    if (phone) donor.phone = phone;
    if (location) donor.location = location;
    if (lastDonationDate !== undefined) {
      donor.lastDonationDate = lastDonationDate ? new Date(lastDonationDate) : null;
    }

    const updatedDonor = await donor.save();

    // If name changed, update user model as well
    if (name) {
      await User.findByIdAndUpdate(donor.userId, { name });
    }

    res.json({
      success: true,
      message: 'Donor profile updated successfully',
      donor: updatedDonor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update donor availability
// @route   PATCH /api/donors/:id/availability
// @access  Protected (Owner or Admin)
const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;

    if (!availability || !['AVAILABLE', 'UNAVAILABLE'].includes(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid availability value. Must be AVAILABLE or UNAVAILABLE',
      });
    }

    const donor = await Donor.findById(req.params.id);

    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // Check authorization: must be owner or admin
    if (donor.userId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to update availability' });
    }

    donor.availability = availability;
    await donor.save();

    res.json({
      success: true,
      message: `Availability updated to ${availability}`,
      donor,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDonors,
  getDonorById,
  createDonor,
  updateDonor,
  updateAvailability,
};
