const Category = require("../models/category");
const Product = require("../models/product");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return res
        .status(400)
        .json({ status: false, message: "Category name is required" });
    }

    const normalized = String(name).trim();
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, "i") },
    });
    if (existing) {
      return res
        .status(400)
        .json({ status: false, message: "Category already exists" });
    }

    const category = await Category.create({ name: normalized });
    res
      .status(201)
      .json({ status: true, message: "Category added successfully", category });
  } catch (error) {
    console.error("Add Category Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.status(200).json({ status: true, categories });
  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ status: false, message: "Category not found" });
    }

    const inUse = await Product.countDocuments({
      category: { $regex: new RegExp(`^${escapeRegex(cat.name)}$`, "i") },
    });

    if (inUse > 0) {
      return res.status(400).json({
        status: false,
        message: `Cannot delete: ${inUse} product(s) use this category. Reassign or remove those products first.`,
      });
    }

    await cat.deleteOne();
    res.status(200).json({ status: true, message: "Category deleted" });
  } catch (error) {
    console.error("Delete Category Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

module.exports = {
  addCategory,
  getCategories,
  deleteCategory,
};
