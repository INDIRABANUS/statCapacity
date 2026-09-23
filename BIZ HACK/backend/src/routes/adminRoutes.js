const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAdminDonors,
  updateDonorStatus,
  updateAdminDonorAvailability,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes are protected and require ADMIN role
router.use(protect, adminOnly);

router.get('/stats', getAdminStats);
router.get('/donors', getAdminDonors);
router.patch('/donors/:id/status', updateDonorStatus);
router.patch('/donors/:id/availability', updateAdminDonorAvailability);

module.exports = router;
