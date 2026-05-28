const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: String, required: true },
  repo: { type: String, required: true },
  pullNumber: { type: Number, required: true },
  prTitle: { type: String },
  prUrl: { type: String },
  summary: { type: String },
  issues: { type: String },
  suggestions: { type: String },
  score: { type: Number },
  scoreBreakdown: {
    codeQuality: { type: Number },
    security: { type: Number },
    performance: { type: Number },
    readability: { type: Number },
  },
  verdict: { type: String, enum: ['APPROVE', 'REQUEST CHANGES', 'NEEDS DISCUSSION'] },
  filesChanged: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Review', ReviewSchema);
