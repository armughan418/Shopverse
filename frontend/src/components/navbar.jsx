import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Menu,
  X,
  User,
  LogOut,
  LogIn,
  Search,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import api from "../utils/api";
import { useLanguage } from "../utils/LanguageContext";

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [mobileProfileDropdown, setMobileProfileDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error(e);
      }
    }
  }, [location.pathname]);

  const fetchCartCount = async () => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setCartCount(0);
      return;
    }
    try {
      const res = await axios.get(api().getCart);
      const items = res.data?.cart?.items || res.data?.items || [];
      const totalItems = items.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0,
      );
      setCartCount(totalItems);
    } catch {
      setCartCount(0);
    }
  };
  useEffect(() => {
    fetchCartCount();
    const handleCartUpdate = () => {
      fetchCartCount();
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    const interval = setInterval(fetchCartCount, 3000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    axios
      .post(api().logoutUser)
      .catch(() => {})
      .finally(() => {
        localStorage.clear();
        setProfileDropdown(false);
        setMobileProfileDropdown(false);
        navigate("/login");
      });
  };

  const NAVBAR_HEIGHT = 70;

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <>
      <nav className="bg-orange-600 shadow-xl fixed w-full top-0 z-50 px-4 md:px-6 h-[70px] flex justify-between items-center border-b border-orange-700">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl md:text-3xl font-extrabold tracking-wide text-white transition hover:text-orange-100 flex items-center gap-2"
        >
          <span className="hidden sm:inline">Bawa Harbal</span>
          <span className="sm:hidden">BQ</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Language Toggle Button */}
          <button
            onClick={() => {
              toggleLanguage();
            }}
            className="px-3 py-1 text-sm font-bold text-white bg-orange-800 hover:bg-orange-900 rounded-lg transition flex items-center gap-1 border-2 border-white"
            style={{ minWidth: "60px" }}
            title={language === "en" ? "Switch to Urdu" : "Switch to English"}
          >
            <span className="text-xs font-bold">
              {language === "en" ? "اردو" : "EN"}
            </span>
          </button>

          <Link
            to="/products"
            className="text-white text-sm font-semibold hover:text-orange-100 px-1"
          >
            {t("allProducts")}
          </Link>

          <button
            onClick={() => navigate("/search")}
            className="p-2 text-white hover:text-orange-100 transition rounded-lg hover:bg-orange-700"
            title={t("search")}
            type="button"
          >
            <Search size={22} />
          </button>

          <button
            type="button"
            onClick={() => {
              const isLoggedIn = !!localStorage.getItem("user");
              if (isLoggedIn) navigate("/shopping-cart");
              else navigate("/login");
            }}
            className="relative p-2 text-white hover:text-orange-100 transition rounded-lg hover:bg-orange-700"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-orange-600">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileDropdown(!profileDropdown)}
              className="p-2 text-white hover:text-orange-100 transition rounded-lg hover:bg-orange-700"
            >
              <User size={22} />
            </button>
            {profileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-2xl rounded-xl border border-gray-200 py-2 z-50">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="font-semibold text-gray-900 text-sm">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigate("/user-profile");
                        setProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-orange-50 flex items-center space-x-2 text-gray-700"
                    >
                      <User className="w-4 h-4 text-orange-600" />
                      <span>{t("myProfile")}</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/order-history");
                        setProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-orange-50 flex items-center space-x-2 text-gray-700"
                    >
                      <ShoppingCart className="w-4 h-4 text-orange-600" />
                      <span>{t("myOrders")}</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center space-x-2 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t("logout")}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      navigate("/login");
                      setProfileDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-orange-50 flex items-center space-x-2 text-gray-700"
                  >
                    <LogIn className="w-4 h-4 text-orange-600" />
                    <span>{t("login")}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu - Search + Hamburger */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={() => navigate("/search")}
            className="p-2 text-white hover:text-orange-100 transition rounded-lg hover:bg-orange-700"
            title={t("search")}
            type="button"
          >
            <Search size={22} />
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-white hover:text-orange-100 transition rounded-lg hover:bg-orange-700"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{t("menu")}</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-orange-700 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div
          className="p-4 space-y-2 overflow-y-auto"
          style={{ height: "calc(100% - 70px)" }}
        >
          {/* Language Toggle */}
          <button
            onClick={() => {
              toggleLanguage();
              setSidebarOpen(false);
            }}
            className="w-full px-4 py-3 text-left rounded-lg bg-orange-50 hover:bg-orange-100 text-gray-700 font-semibold flex items-center justify-between transition"
          >
            <span>{language === "en" ? "Urdu" : "English"}</span>
            <span className="text-orange-600 font-bold">
              {language === "en" ? "اردو" : "EN"}
            </span>
          </button>

          <hr className="my-2" />

          {/* Shopping Cart */}
          <button
            onClick={() => {
              const isLoggedIn = !!localStorage.getItem("user");
              if (isLoggedIn) handleNavigation("/shopping-cart");
              else handleNavigation("/login");
            }}
            className="w-full text-left px-4 py-3 hover:bg-orange-50 flex items-center space-x-3 text-gray-700 rounded-lg transition"
          >
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            <span className="flex-1">{t("cart")}</span>
            {cartCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          <hr className="my-2" />

          {/* User Section */}
          {user ? (
            <>
              <div className="px-4 py-3 bg-gray-100 rounded-lg">
                <p className="font-semibold text-gray-900 text-sm">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>

              <button
                onClick={() => handleNavigation("/user-profile")}
                className="w-full text-left px-4 py-3 hover:bg-orange-50 flex items-center space-x-3 text-gray-700 rounded-lg transition"
              >
                <User className="w-5 h-5 text-orange-600" />
                <span>{t("myProfile")}</span>
              </button>

              <button
                onClick={() => handleNavigation("/order-history")}
                className="w-full text-left px-4 py-3 hover:bg-orange-50 flex items-center space-x-3 text-gray-700 rounded-lg transition"
              >
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                <span>{t("myOrders")}</span>
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  setSidebarOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center space-x-3 text-red-600 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                <span>{t("logout")}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavigation("/login")}
                className="w-full text-left px-4 py-3 hover:bg-orange-50 flex items-center space-x-3 text-gray-700 rounded-lg transition"
              >
                <LogIn className="w-5 h-5 text-orange-600" />
                <span>{t("login")}</span>
              </button>

              <button
                onClick={() => handleNavigation("/signup")}
                className="w-full text-left px-4 py-3 hover:bg-orange-50 flex items-center space-x-3 text-gray-700 rounded-lg transition"
              >
                <User className="w-5 h-5 text-orange-600" />
                <span>{t("signup")}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ height: NAVBAR_HEIGHT }}></div>
    </>
  );
};

export default Navbar;
