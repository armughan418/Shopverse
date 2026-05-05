require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const getConnection = require("./utils/getConnection");

const userRoutes = require("./routes/userRoute");
const productRoutes = require("./routes/productRoute");
const cartRoutes = require("./routes/cartRoute");
const orderRoutes = require("./routes/orderRoute");
const adminRoutes = require("./routes/adminRoute");
const reviewRoute = require("./routes/reviewRoute");
const cloudinaryRoute = require("./routes/cloudinaryRoute");
const carouselRoute = require("./routes/carouselRoute");
const categoryRoute = require("./routes/categoryRoute");

const app = express();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? process.env.frontend_url : true,
    credentials: true,
  }),
);

app.use(compression());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX) || 400,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.use("/api/user", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoute);
app.use("/api/cloudinary", cloudinaryRoute);
app.use("/api/carousel", carouselRoute);
app.use("/api/categories", categoryRoute);

app.get("/", (req, res) => {
  res.json({ message: "Server is running successfully" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ success: false, message });
});

getConnection();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is up and running on port ${PORT}`));
