const Donor = require('../models/Donor');
const User = require('../models/User');

// @desc    Get dashboard statistics for Admin
// @route   GET /api/admin/stats
// @access  Protected (Admin only)
const getAdminStats = async (req, res, next) => {
  try {
    const totalDonors = await Donor.countDocuments();
    const activeDonors = await Donor.countDocuments({ status: 'ACTIVE' });
    const inactiveDonors = await Donor.countDocuments({ status: 'INACTIVE' });
    const availableDonors = await Donor.countDocuments({ status: 'ACTIVE', availability: 'AVAILABLE' });
    const unavailableDonors = await Donor.countDocuments({ availability: 'UNAVAILABLE' });

    // Blood group distribution
    const bloodGroupStats = await Donor.aggregate([
      {
        $group: {
          _id: '$bloodGroup',
          count: { $sum: 1 },
          availableCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$status', 'ACTIVE'] }, { $eq: ['$availability', 'AVAILABLE'] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalDonors,
        activeDonors,
        inactiveDonors,
        availableDonors,
        unavailableDonors,
        bloodGroupStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all donors (Admin view with search & filters)
// @route   GET /api/admin/donors
// @access  Protected (Admin only)
const getAdminDonors = async (req, res, next) => {
  try {
    const { bloodGroup, status, availability, search } = req.query;

    const filter = {};

    if (bloodGroup && bloodGroup.trim() !== '' && bloodGroup.toUpperCase() !== 'ALL') {
      filter.bloodGroup = decodeURIComponent(bloodGroup).trim().toUpperCase();
    }

    if (status && ['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    if (availability && ['AVAILABLE', 'UNAVAILABLE'].includes(availability.toUpperCase())) {
      filter.availability = availability.toUpperCase();
    }

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { location: searchRegex },
      ];
    }

    const donors = await Donor.find(filter)
      .populate('userId', 'name email role status createdAt')
      .sort({ updatedAt: -1, createdAt: -1 });

    res.json({
      success: true,
      count: donors.length,
      donors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update donor status (Activate / Deactivate)
// @route   PATCH /api/admin/donors/:id/status
// @access  Protected (Admin only)
const updateDonorStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be ACTIVE or INACTIVE',
      });
    }

    const donor = await Donor.findById(req.params.id);

    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    donor.status = status.toUpperCase();
    await donor.save();

    // Also update associated User status
    if (donor.userId) {
      await User.findByIdAndUpdate(donor.userId, { status: status.toUpperCase() });
    }

    res.json({
      success: true,
      message: `Donor status updated to ${donor.status}`,
      donor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update donor availability by admin
// @route   PATCH /api/admin/donors/:id/availability
// @access  Protected (Admin only)
const updateAdminDonorAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;

    if (!availability || !['AVAILABLE', 'UNAVAILABLE'].includes(availability.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid availability. Must be AVAILABLE or UNAVAILABLE',
      });
    }

    const donor = await Donor.findById(req.params.id);

    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    donor.availability = availability.toUpperCase();
    await donor.save();

    res.json({
      success: true,
      message: `Donor availability updated to ${donor.availability}`,
      donor,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAdminDonors,
  updateDonorStatus,
  updateAdminDonorAvailability,
};
