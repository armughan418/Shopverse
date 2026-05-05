const Review = require("../models/review");
const { syncProductRatingFromReviews } = require("../utils/syncProductRating");

const getProductReviews = async (req, res) => {
  try {
    const productId = req.params.productId;
    const reviews = await Review.find({ product: productId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId;
    const userId = req.user.id || req.user._id;

    // Validate required fields
    if (!rating || !comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rating and comment are required",
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const newReview = await Review.create({
      rating,
      comment: comment.trim(),
      product: productId,
      user: userId,
    });

    await syncProductRatingFromReviews(productId);

    res.json({ success: true, review: newReview });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const removed = await Review.findByIdAndDelete(reviewId);
    if (removed?.product) {
      await syncProductRatingFromReviews(removed.product);
    }
    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProductReviews,
  addReview,
  deleteReview,
};
