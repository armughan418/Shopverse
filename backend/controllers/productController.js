const Product = require("../models/product");
const Order = require("../models/order");
const Review = require("../models/review");
const cloudinary = require("cloudinary").v2;
const cache = require("../utils/simpleCache");
const { attachReviewAggregates } = require("../utils/syncProductRating");

const LIST_SELECT =
  "name nameUrdu description descriptionUrdu price oldPrice image media rating numReviews category inStock createdAt";

/** Homepage cards: tight projection (no createdAt on payload). */
const HOME_SELECT =
  "name nameUrdu description descriptionUrdu price oldPrice image media rating numReviews category inStock";

const CACHE_TTL_MS = 60 * 1000;

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fetchProductsByIdsOrdered(ids, selectFields = LIST_SELECT) {
  if (!ids.length) return [];
  const rows = await Product.find({ _id: { $in: ids } })
    .select(selectFields)
    .lean();
  const map = new Map(rows.map((r) => [String(r._id), r]));
  return ids.map((id) => map.get(String(id))).filter(Boolean);
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "products", resource_type: "auto" },
      (error, uploadedImage) => {
        if (error) return reject(error);
        resolve(uploadedImage);
      },
    );
    stream.end(fileBuffer);
  });
};

const addProduct = async (req, res) => {
  try {
    const {
      name,
      nameUrdu,
      description,
      descriptionUrdu,
      price,
      oldPrice,
      category,
      stockCount,
      inStock,
    } = req.body;

    const uploadedMedia = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const uploadedFile = await uploadToCloudinary(file.buffer);
        uploadedMedia.push({
          url: uploadedFile.secure_url,
          type: file.mimetype?.startsWith("video/") ? "video" : "image",
          sortOrder: i,
        });
      }
    } else if (req.body.image) {
      uploadedMedia.push({
        url: req.body.image,
        type: "image",
        sortOrder: 0,
      });
    }

    if (uploadedMedia.length === 0) {
      return res
        .status(400)
        .json({ status: false, message: "At least one image/video is required" });
    }

    const primaryImage =
      uploadedMedia.find((m) => m.type === "image")?.url || uploadedMedia[0].url;

    const product = new Product({
      name,
      nameUrdu: nameUrdu || "",
      description,
      descriptionUrdu: descriptionUrdu || "",
      price: Number(price),
      oldPrice: oldPrice !== undefined ? Number(oldPrice) : undefined,
      category,
      stockCount: Number(stockCount) || 0,
      inStock: inStock === "true" || inStock === true,
      image: primaryImage,
      media: uploadedMedia,
    });

    await product.save();
    cache.clearProductLists();

    res.status(201).json({
      status: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const rawLimit = Number(req.query.limit);
    const limit = Math.min(
      Math.max(Number.isFinite(rawLimit) ? rawLimit : 12, 1),
      500,
    );
    const skip = (page - 1) * limit;

    const cacheKey = `products:list:${page}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ status: true, ...cached });
    }

    const filter = {};
    const total = await Product.countDocuments(filter);

    let products = await Product.find(filter)
      .select(LIST_SELECT)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    products = await attachReviewAggregates(products);

    const payload = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
      count: products.length,
      products,
    };
    cache.set(cacheKey, payload, CACHE_TTL_MS);

    res.status(200).json({ status: true, ...payload });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const cacheKey = "products:featured";
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ status: true, ...cached });

    let products = await Product.find({ inStock: true })
      .select(LIST_SELECT)
      .sort({ rating: -1, numReviews: -1, createdAt: -1 })
      .limit(6)
      .lean();

    products = await attachReviewAggregates(products);

    const payload = { products };
    cache.set(cacheKey, payload, CACHE_TTL_MS);
    res.status(200).json({ status: true, ...payload });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

const getBestsellers = async (req, res) => {
  try {
    const cacheKey = "products:bestsellers";
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ status: true, ...cached });

    const agg = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          sold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 8 },
    ]);

    let orderedIds = agg.map((a) => a._id).filter(Boolean);

    let products;
    if (orderedIds.length === 0) {
      products = await Product.find({ inStock: true })
        .select(LIST_SELECT)
        .sort({ numReviews: -1, rating: -1 })
        .limit(8)
        .lean();
    } else {
      products = await fetchProductsByIdsOrdered(orderedIds);
    }

    products = await attachReviewAggregates(products);

    const payload = { products };
    cache.set(cacheKey, payload, CACHE_TTL_MS);
    res.status(200).json({ status: true, ...payload });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

const getNewArrivals = async (req, res) => {
  try {
    const cacheKey = "products:new";
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ status: true, ...cached });

    let products = await Product.find()
      .select(LIST_SELECT)
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    products = await attachReviewAggregates(products);

    const payload = { products };
    cache.set(cacheKey, payload, CACHE_TTL_MS);
    res.status(200).json({ status: true, ...payload });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * Single response for home: Featured (6) → Best sellers (8, excl. featured) → New (8, excl. both).
 * No duplicate product IDs across sections.
 */
const getHomepageProducts = async (req, res) => {
  try {
    const cacheKey = "products:homepage";
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ status: true, ...cached });

    let featured = await Product.find({ inStock: true })
      .select(HOME_SELECT)
      .sort({ rating: -1, numReviews: -1, createdAt: -1 })
      .limit(6)
      .lean();

    featured = await attachReviewAggregates(featured);
    const featuredIds = featured.map((p) => p._id);

    const excludeFeaturedStage =
      featuredIds.length > 0 ? [{ $match: { _id: { $nin: featuredIds } } }] : [];

    const salesAgg = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          sold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { sold: -1 } },
      ...excludeFeaturedStage,
      { $limit: 8 },
    ]);

    const soldIds = salesAgg.map((a) => a._id).filter(Boolean);

    let bestsellers;
    if (soldIds.length === 0) {
      bestsellers = await Product.find({
        inStock: true,
        ...(featuredIds.length ? { _id: { $nin: featuredIds } } : {}),
      })
        .select(HOME_SELECT)
        .sort({ numReviews: -1, rating: -1, createdAt: -1 })
        .limit(8)
        .lean();
    } else {
      bestsellers = await fetchProductsByIdsOrdered(soldIds, HOME_SELECT);
    }

    bestsellers = await attachReviewAggregates(bestsellers);
    const bestsellerIds = bestsellers.map((p) => p._id);

    const excludedForNew = [...featuredIds, ...bestsellerIds];

    let newArrivals = await Product.find(
      excludedForNew.length ? { _id: { $nin: excludedForNew } } : {},
    )
      .select(HOME_SELECT)
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    newArrivals = await attachReviewAggregates(newArrivals);

    const payload = {
      featured,
      bestsellers,
      newArrivals,
    };

    cache.set(cacheKey, payload, CACHE_TTL_MS);
    res.status(200).json({ status: true, ...payload });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const raw = req.params.categoryName || "";
    const categoryName = decodeURIComponent(raw).trim();
    if (!categoryName) {
      return res.status(400).json({ status: false, message: "Category required" });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const rawLimit = Number(req.query.limit);
    const limit = Math.min(
      Math.max(Number.isFinite(rawLimit) ? rawLimit : 12, 1),
      100,
    );
    const skip = (page - 1) * limit;

    const cacheKey = `products:cat:${categoryName}:${page}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ status: true, ...cached });

    const filter = {
      category: { $regex: new RegExp(`^${escapeRegex(categoryName)}$`, "i") },
    };

    const total = await Product.countDocuments(filter);
    let products = await Product.find(filter)
      .select(LIST_SELECT)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    products = await attachReviewAggregates(products);

    const payload = {
      category: categoryName,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
      count: products.length,
      products,
    };
    cache.set(cacheKey, payload, CACHE_TTL_MS);
    res.status(200).json({ status: true, ...payload });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

const searchProducts = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const rawLimit = Number(req.query.limit);
    const limit = Math.min(
      Math.max(Number.isFinite(rawLimit) ? rawLimit : 12, 1),
      50,
    );
    const skip = (page - 1) * limit;

    const sortParam = String(req.query.sort || "").trim();
    const minR = Math.min(
      5,
      Math.max(0, Number.parseInt(String(req.query.minRating ?? ""), 10) || 0),
    );

    if (!q) {
      return res.status(200).json({
        status: true,
        page,
        limit,
        sort: sortParam,
        minRating: minR,
        total: 0,
        totalPages: 0,
        count: 0,
        products: [],
      });
    }

    const cacheKey = `products:search:${q}:${page}:${limit}:${sortParam}:${minR}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ status: true, ...cached });

    const ratingClause =
      minR > 0 ? { rating: { $gte: minR } } : {};

    let textSort;
    if (sortParam === "price-asc") textSort = { price: 1 };
    else if (sortParam === "price-desc") textSort = { price: -1 };
    else textSort = { score: { $meta: "textScore" } };

    let fallbackSort;
    if (sortParam === "price-asc") fallbackSort = { price: 1 };
    else if (sortParam === "price-desc") fallbackSort = { price: -1 };
    else fallbackSort = { createdAt: -1 };

    const rx = new RegExp(escapeRegex(q), "i");
    const orClause = {
      $or: [
        { name: rx },
        { description: rx },
        { nameUrdu: rx },
        { descriptionUrdu: rx },
      ],
    };
    const fallbackFilter =
      minR > 0 ? { $and: [orClause, { rating: { $gte: minR } }] } : orClause;

    let products;
    let total;

    try {
      const textFilter = { $text: { $search: q }, ...ratingClause };
      total = await Product.countDocuments(textFilter);
      products = await Product.find(textFilter)
        .select(LIST_SELECT)
        .sort(textSort)
        .skip(skip)
        .limit(limit)
        .lean();
    } catch {
      total = await Product.countDocuments(fallbackFilter);
      products = await Product.find(fallbackFilter)
        .select(LIST_SELECT)
        .sort(fallbackSort)
        .skip(skip)
        .limit(limit)
        .lean();
    }

    products = await attachReviewAggregates(products);

    const payload = {
      q,
      page,
      limit,
      sort: sortParam,
      minRating: minR,
      total,
      totalPages: Math.ceil(total / limit) || 0,
      count: products.length,
      products,
    };
    cache.set(cacheKey, payload, CACHE_TTL_MS);
    res.status(200).json({ status: true, ...payload });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });

    // Also aggregate reviews for this product from Review collection
    const reviews = await Review.find({ product: product._id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const numReviews = reviews.length;
    const avgRating = numReviews
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / numReviews
      : 0;

    const productObj = {
      ...product._doc,
      avgRating,
      numReviews,
      reviews,
    };

    res.status(200).json({ status: true, product: productObj });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });

    let existingMedia = [];
    if (req.body.existingMedia) {
      try {
        const parsedMedia = JSON.parse(req.body.existingMedia);
        if (Array.isArray(parsedMedia)) {
          existingMedia = parsedMedia
            .filter((m) => m?.url && (m?.type === "image" || m?.type === "video"))
            .map((m, index) => ({
              url: m.url,
              type: m.type,
              sortOrder: index,
            }));
        }
      } catch (e) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid existing media format" });
      }
    } else if (Array.isArray(product.media) && product.media.length > 0) {
      existingMedia = [...product.media].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
      );
    } else if (product.image) {
      existingMedia = [{ url: product.image, type: "image", sortOrder: 0 }];
    }

    const newMedia = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const uploadedFile = await uploadToCloudinary(file.buffer);
        newMedia.push({
          url: uploadedFile.secure_url,
          type: file.mimetype?.startsWith("video/") ? "video" : "image",
          sortOrder: existingMedia.length + i,
        });
      }
    }

    const combinedMedia = [...existingMedia, ...newMedia].map((m, index) => ({
      ...m,
      sortOrder: index,
    }));

    if (combinedMedia.length === 0 && req.body.image) {
      combinedMedia.push({ url: req.body.image, type: "image", sortOrder: 0 });
    }

    if (combinedMedia.length > 0) {
      product.media = combinedMedia;
      product.image =
        combinedMedia.find((m) => m.type === "image")?.url || combinedMedia[0].url;
    }

    // Merge other updatable fields
    const updates = { ...req.body };
    delete updates.image;
    delete updates.existingMedia;

    // Normalize types for known fields coming from multipart/form-data
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.oldPrice !== undefined)
      updates.oldPrice = Number(updates.oldPrice);
    if (updates.stockCount !== undefined) {
      updates.stockCount = Number(updates.stockCount) || 0;
      // Auto update inStock based on stockCount
      updates.inStock = updates.stockCount > 0;
    }
    if (updates.inStock !== undefined)
      updates.inStock =
        updates.inStock === "true" ||
        updates.inStock === true ||
        updates.inStock === "1";

    // Ensure category is applied as string if provided
    if (updates.category !== undefined)
      updates.category = String(updates.category);

    if (updates.nameUrdu !== undefined) updates.nameUrdu = String(updates.nameUrdu);
    if (updates.descriptionUrdu !== undefined)
      updates.descriptionUrdu = String(updates.descriptionUrdu);

    Object.assign(product, updates);

    await product.save();
    cache.clearProductLists();

    res.status(200).json({ status: true, message: "Product updated", product });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });

    await product.deleteOne();
    cache.clearProductLists();
    res
      .status(200)
      .json({ status: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product)
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });

    if (!rating || rating < 1 || rating > 5)
      return res
        .status(400)
        .json({ status: false, message: "Invalid rating value" });

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user.id,
    );

    if (alreadyReviewed)
      return res
        .status(400)
        .json({ status: false, message: "Product already reviewed" });

    const review = {
      user: req.user.id,
      name: req.user.name,
      rating,
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => acc + item.rating, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ status: true, message: "Review added", product });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  getHomepageProducts,
  getFeaturedProducts,
  getBestsellers,
  getNewArrivals,
  getProductsByCategory,
  searchProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  addReview,
};
