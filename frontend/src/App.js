import "./App.css";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/home";
import ProductDetails from "./pages/productDetails";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Super from "./components/super";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NotFound from "./pages/notFound";
import Navbar from "./components/navbar";
import OrderHistory from "./pages/orderHistory";
import ShoppingCart from "./pages/shoppingCart";
import OrderSummary from "./pages/orderSummary";
import OrderTracking from "./pages/orderTracking";
import UserTable from "./pages/userTable";
import AdminDashboard from "./pages/adminDashboard";
import SearchPage from "./pages/searchPage";
import ProductsPage from "./pages/productsPage";
import CategoryPage from "./pages/categoryPage";
import AddProduct from "./pages/addProduct";
import RatingReviews from "./pages/ratingReviews";
import ManageProducts from "./pages/manageProduct";
import CarouselSetting from "./pages/CarouselSetting";
import AddCarousel from "./pages/addCarousel";
import Profile from "./pages/profile";
import Checkout from "./pages/checkout";
import AdminOrders from "./pages/adminOrders";
import AdminRoute from "./components/adminRoute";
import AdditionalCharges from "./pages/additionalCharges";
import ManageCategories from "./pages/manageCategories";

function App() {
  const location = useLocation();

  const adminRoutes = [
    "/admin-dashboard",
    "/admin-orders",
    "/user-table",
    "/add-products",
    "/manage-products",
    "/add-carousel",
    "/rating-and-reviews",
    "/set-carousel",
    "/additional-charges",
    "/admin-categories",
  ];

  const isAdminRoute = adminRoutes.some((route) =>
    location.pathname.startsWith(route),
  );

  return (
    <>
      {!isAdminRoute && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/category/:categoryName" element={<CategoryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/search-products" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductDetails />} />

        {/* Protected User Routes */}
        <Route element={<Super />}>
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/shopping-cart" element={<ShoppingCart />} />
          <Route path="/order-summary" element={<OrderSummary />} />
          <Route path="/order-summary/:id" element={<OrderSummary />} />
          <Route path="/order-tracking" element={<OrderTracking />} />
          <Route path="/user-profile" element={<Profile />} />
          <Route path="/checkout" element={<Checkout />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-categories" element={<ManageCategories />} />
          <Route path="/admin-orders" element={<AdminOrders />} />
          <Route path="/user-table" element={<UserTable />} />
          <Route path="/add-products" element={<AddProduct />} />
          <Route path="/manage-products" element={<ManageProducts />} />
          <Route path="/add-carousel" element={<AddCarousel />} />
          <Route path="/rating-and-reviews" element={<RatingReviews />} />
          <Route path="/set-carousel" element={<CarouselSetting />} />
          <Route path="/additional-charges" element={<AdditionalCharges />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        theme="colored"
        transition={Slide}
      />
    </>
  );
}

export default App;
