const express = require('express');
const router = express.Router();
const {
  getDonors,
  getDonorById,
  createDonor,
  updateDonor,
  updateAvailability,
} = require('../controllers/donorController');
const { protect } = require('../middleware/authMiddleware');

// Public route: search donors (Strictly ACTIVE + AVAILABLE)
router.get('/', getDonors);

// Public route: get single donor by id
router.get('/:id', getDonorById);

// Protected routes: donor profile management
router.post('/', protect, createDonor);
router.put('/:id', protect, updateDonor);
router.patch('/:id/availability', protect, updateAvailability);

module.exports = router;
