const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer");

const {
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
} = require("../controllers/productController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.post(
  "/add",
  authMiddleware,
  adminMiddleware,
  upload.array("media"),
  addProduct
);

router.put(
  "/update/:id",
  authMiddleware,
  adminMiddleware,
  upload.array("media"),
  updateProduct
);

router.delete("/delete/:id", authMiddleware, adminMiddleware, deleteProduct);

router.get("/homepage", getHomepageProducts);
router.get("/featured", getFeaturedProducts);
router.get("/bestsellers", getBestsellers);
router.get("/new", getNewArrivals);
router.get("/search", searchProducts);
router.get("/category/:categoryName", getProductsByCategory);
router.get("/", getAllProducts);
router.get("/:id", getSingleProduct);

router.post("/:id/review", authMiddleware, addReview);

module.exports = router;
