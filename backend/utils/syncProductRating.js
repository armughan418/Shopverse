const mongoose = require("mongoose");
const Review = require("../models/review");
const Product = require("../models/product");
const cache = require("./simpleCache");

/**
 * Recompute Product.rating / numReviews from the Review collection (source of truth).
 */
async function syncProductRatingFromReviews(productId) {
  const pid =
    typeof productId === "string"
      ? new mongoose.Types.ObjectId(productId)
      : productId;

  const stats = await Review.aggregate([
    { $match: { product: pid } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const rating = stats[0] ? Math.round(stats[0].avg * 10) / 10 : 0;
  const numReviews = stats[0] ? stats[0].count : 0;

  await Product.findByIdAndUpdate(productId, { rating, numReviews });
  cache.clearProductLists();
}

/**
 * Merge aggregated Review stats into product list payloads (lean docs).
 */
async function attachReviewAggregates(products) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const ids = products.map((p) => p._id).filter(Boolean);
  const stats = await Review.aggregate([
    { $match: { product: { $in: ids } } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  const map = new Map(
    stats.map((s) => [
      String(s._id),
      {
        rating: Math.round(s.avgRating * 10) / 10,
        numReviews: s.numReviews,
      },
    ]),
  );

  return products.map((p) => {
    const s = map.get(String(p._id));
    if (s) {
      return { ...p, rating: s.rating, numReviews: s.numReviews };
    }
    return {
      ...p,
      rating: p.rating ?? 0,
      numReviews: p.numReviews ?? 0,
    };
  });
}

module.exports = { syncProductRatingFromReviews, attachReviewAggregates };
