const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameUrdu: { type: String, default: "" },
    description: { type: String, required: true },
    descriptionUrdu: { type: String, default: "" },
    price: { type: Number, required: true },
    oldPrice: { type: Number },
    category: { type: String, required: true },
    image: { type: String, required: true },
    media: [mediaSchema],
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, default: 0 },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ inStock: 1, rating: -1, numReviews: -1 });
productSchema.index({
  name: "text",
  description: "text",
  nameUrdu: "text",
  descriptionUrdu: "text",
});

module.exports = mongoose.model("Product", productSchema);
