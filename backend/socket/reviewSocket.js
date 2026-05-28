const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Review = require('../models/Review');
const { runReviewPipeline } = require('../services/groqService');
const { fetchPRDiff, fetchPRDetails } = require('../services/githubService');

const reviewSocket = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: no token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('Authentication error: user not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (${socket.user.username})`);

    socket.on('review:start', async ({ owner, repo, pull_number }) => {
      console.log(`🤖 Starting review for ${owner}/${repo}#${pull_number}`);

      try {
        // Fetch PR details and diff
        const [prDetails, rawDiff] = await Promise.all([
          fetchPRDetails(owner, repo, pull_number, socket.user.accessToken),
          fetchPRDiff(owner, repo, pull_number, socket.user.accessToken),
        ]);

        socket.emit('review:pr_info', {
          title: prDetails.title,
          url: prDetails.html_url,
          filesChanged: prDetails.changed_files,
        });

        // Run 4-step pipeline
        const result = await runReviewPipeline(
          rawDiff,
          // onStepStart
          (step, label) => {
            socket.emit('review:step', { step, label, content: '' });
          },
          // onToken
          (step, token) => {
            socket.emit('review:token', { step, token });
          },
          // onStepDone
          (step, content) => {
            socket.emit('review:step_done', { step, content });
          }
        );

        // Save to MongoDB
        const review = await Review.create({
          userId: socket.user._id,
          owner,
          repo,
          pullNumber: pull_number,
          prTitle: prDetails.title,
          prUrl: prDetails.html_url,
          summary: result.summary,
          issues: result.issues,
          suggestions: result.suggestions,
          score: result.score,
          scoreBreakdown: result.scoreBreakdown,
          verdict: result.verdict,
          filesChanged: prDetails.changed_files,
        });

        socket.emit('review:complete', {
          reviewId: review._id,
          score: result.score,
          scoreBreakdown: result.scoreBreakdown,
          verdict: result.verdict,
          verdictLine: result.verdictLine,
        });
      } catch (err) {
        console.error('Review pipeline error:', err.message);
        socket.emit('review:error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = reviewSocket;
