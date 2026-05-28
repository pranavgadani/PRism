const Review = require('../models/Review');

// GET /review/history
const getReviewHistory = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-__v');
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching history:', err.message);
    res.status(500).json({ message: 'Failed to fetch review history' });
  }
};

// GET /review/:id
const getReviewById = async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (err) {
    console.error('Error fetching review:', err.message);
    res.status(500).json({ message: 'Failed to fetch review' });
  }
};

module.exports = { getReviewHistory, getReviewById };
