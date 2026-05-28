const express = require('express');
const router = express.Router();
const { redirectToGitHub, handleGitHubCallback, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.get('/github', redirectToGitHub);
router.get('/github/callback', handleGitHubCallback);
router.get('/me', protect, getMe);

module.exports = router;
