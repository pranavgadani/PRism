const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getReviewHistory, getReviewById } = require('../controllers/reviewController');

router.get('/history', protect, getReviewHistory);
router.get('/:id', protect, getReviewById);

module.exports = router;
