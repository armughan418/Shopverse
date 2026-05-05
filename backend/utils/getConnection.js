const mongoose = require("mongoose");

const getConnection = async () => {
  try {
    await mongoose.connect(process.env.MongoDB_URL);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = getConnection;
