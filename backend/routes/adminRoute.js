const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const OrderChargeSetting = require("../models/orderChargeSetting");

// ----------------------
// GET ADMIN STATS
// ----------------------
router.get("/stats", auth, admin, async (req, res) => {
  try {
    // Basic counts
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    // Total sales
    const orders = await Order.find().populate("items.product");
    const totalSales = orders.reduce((acc, order) => {
      return acc + (order.totalPrice || 0);
    }, 0);

    // Current month sales
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentMonthSales = orders
      .filter((order) => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= startOfMonth && createdAt < endOfMonth;
      })
      .reduce((acc, order) => acc + (order.totalPrice || 0), 0);

    // Current month daily sales trend
    const currentMonthDailyAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          sales: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const daysInCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const currentMonthSalesByDay = Array.from(
      { length: daysInCurrentMonth },
      (_, i) => {
        const day = i + 1;
        const dayData = currentMonthDailyAgg.find((item) => item._id === day);
        return {
          day: String(day),
          sales: dayData?.sales || 0,
          orders: dayData?.orders || 0,
        };
      },
    );

    // Orders by status (dynamic)
    const ordersByStatusAgg = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const ordersByStatus = {};
    ordersByStatusAgg.forEach((r) => (ordersByStatus[r._id] = r.count));

    // Yearly monthly sales trend (current year)
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const yearlySalesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lt: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          sales: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const salesByMonth = monthLabels.map((month, index) => {
      const monthData = yearlySalesAgg.find((item) => item._id === index + 1);
      return {
        month,
        sales: monthData?.sales || 0,
        orders: monthData?.orders || 0,
      };
    });

    // Top 5 products by quantity sold
    const productSalesMap = {};
    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          // Handle both populated and non-populated product
          const productId = item.product?._id 
            ? item.product._id.toString() 
            : item.product?.toString() || item.product;
          
          if (productId) {
            productSalesMap[productId] =
              (productSalesMap[productId] || 0) + (item.quantity || 0);
          }
        });
      }
    });

    const topProducts = Object.entries(productSalesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topProductsDetailed = await Promise.all(
      topProducts.map(async ([productId, qty]) => {
        try {
          const product = await Product.findById(productId);
          return {
            id: productId,
            name: product ? product.name : "Deleted Product",
            quantitySold: qty || 0,
          };
        } catch (error) {
          return {
            id: productId,
            name: "Deleted Product",
            quantitySold: qty || 0,
          };
        }
      })
    );

    res.json({
      status: true,
      totalOrders,
      totalUsers,
      totalProducts,
      totalSales,
      currentMonthSales,
      currentMonthSalesByDay,
      ordersByStatus, // dynamic statuses
      salesByMonth,
      topProducts: topProductsDetailed,
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// ----------------------
// GET ORDER CHARGES
// ----------------------
router.get("/order-charges", auth, admin, async (req, res) => {
  try {
    let settings = await OrderChargeSetting.findOne({ key: "global" });
    if (!settings) {
      settings = await OrderChargeSetting.create({ key: "global" });
    }

    res.json({
      status: true,
      settings: {
        deliveryCost: settings.deliveryCost,
        discountPercentage: settings.discountPercentage,
        taxPercentage: settings.taxPercentage,
      },
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// ----------------------
// UPDATE ORDER CHARGES
// ----------------------
router.put("/order-charges", auth, admin, async (req, res) => {
  try {
    const { deliveryCost, discountPercentage, taxPercentage } = req.body;

    const parsedDeliveryCost = Number(deliveryCost);
    const parsedDiscountPercentage = Number(discountPercentage);
    const parsedTaxPercentage = Number(taxPercentage);

    if (
      Number.isNaN(parsedDeliveryCost) ||
      Number.isNaN(parsedDiscountPercentage) ||
      Number.isNaN(parsedTaxPercentage)
    ) {
      return res.status(400).json({
        status: false,
        message: "All values must be valid numbers",
      });
    }

    if (parsedDeliveryCost < 0) {
      return res.status(400).json({
        status: false,
        message: "Delivery cost cannot be negative",
      });
    }

    if (parsedDiscountPercentage < 0 || parsedDiscountPercentage > 100) {
      return res.status(400).json({
        status: false,
        message: "Discount percentage must be between 0 and 100",
      });
    }

    if (parsedTaxPercentage < 0 || parsedTaxPercentage > 100) {
      return res.status(400).json({
        status: false,
        message: "Tax percentage must be between 0 and 100",
      });
    }

    const settings = await OrderChargeSetting.findOneAndUpdate(
      { key: "global" },
      {
        key: "global",
        deliveryCost: parsedDeliveryCost,
        discountPercentage: parsedDiscountPercentage,
        taxPercentage: parsedTaxPercentage,
      },
      { new: true, upsert: true, runValidators: true },
    );

    res.json({
      status: true,
      message: "Order charges updated successfully",
      settings: {
        deliveryCost: settings.deliveryCost,
        discountPercentage: settings.discountPercentage,
        taxPercentage: settings.taxPercentage,
      },
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

module.exports = router;
