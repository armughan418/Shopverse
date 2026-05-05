const express = require("express");
const router = express.Router();
const {
  addCategory,
  getCategories,
  deleteCategory,
} = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.get("/", getCategories);
router.post("/add", authMiddleware, adminMiddleware, addCategory);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);

module.exports = router;
