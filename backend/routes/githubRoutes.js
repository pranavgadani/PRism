const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserRepos,
  getRepoPulls,
  getPullFiles,
  getPullDiff,
  postReviewComment,
} = require('../controllers/githubController');
const { analyzeRepo } = require('../controllers/repoAnalysisController');

router.get('/repos', protect, getUserRepos);
router.get('/repos/:owner/:repo/pulls', protect, getRepoPulls);
router.get('/repos/:owner/:repo/pulls/:pull_number/files', protect, getPullFiles);
router.get('/repos/:owner/:repo/analyze', protect, analyzeRepo);
router.get('/pulls/:owner/:repo/:pull_number/diff', protect, getPullDiff);
router.post('/comment', protect, postReviewComment);

module.exports = router;
