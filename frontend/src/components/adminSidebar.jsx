import { useState } from "react";
import {
  Menu,
  User,
  LogOut,
  LayoutDashboard,
  Users,
  PlusCircle,
  Boxes,
  Star,
  SlidersHorizontal,
  Settings,
  BadgePercent,
  Tags,
} from "lucide-react";
import { FaFirstOrder } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../utils/api";

function AdminSidebar({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard />, path: "/admin-dashboard" },
    { name: "Users", icon: <Users />, path: "/user-table" },
    { name: "Orders", icon: <FaFirstOrder />, path: "/admin-orders" },
    {
      name: "Additional Charges",
      icon: <BadgePercent />,
      path: "/additional-charges",
    },
    { name: "Categories", icon: <Tags />, path: "/admin-categories" },
    { name: "Add Product", icon: <PlusCircle />, path: "/add-products" },
    { name: "Manage Products", icon: <Boxes />, path: "/manage-products" },
    { name: "Rating & Reviews", icon: <Star />, path: "/rating-and-reviews" },
    {
      name: "Add Carousel",
      icon: <SlidersHorizontal />,
      path: "/add-carousel",
    },
    { name: "Carousel Settings", icon: <Settings />, path: "/set-carousel" },
  ];

  return (
    <div className="flex h-screen bg-orange-50">
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-orange-600 to-orange-700 shadow-xl transition-all duration-300 p-4 flex flex-col`}
      >
        <h2 className="text-xl font-extrabold mb-6 text-white tracking-wide">
          {sidebarOpen ? "Bawa Harbal" : "BH"}
        </h2>

        <nav className="space-y-2 text-white font-medium">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? "bg-white text-orange-600 shadow-md"
                    : "hover:bg-orange-500/40 text-white"
                }`
              }
            >
              {item.icon}
              {sidebarOpen && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="flex justify-between items-center bg-white/70 backdrop-blur-md border-b px-6 py-4 shadow-sm relative z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-orange-100 transition"
          >
            <Menu className="text-orange-600" />
          </button>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-3 rounded-full bg-orange-100 hover:bg-orange-200 transition"
            >
              <User size={20} className="text-orange-700" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-14 w-48 bg-white border shadow-xl rounded-xl py-2 z-50">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-orange-50 cursor-pointer flex gap-2 items-center"
                  onClick={() => navigate("/user-profile")}
                >
                  <User size={18} /> My Profile
                </button>

                <button
                  className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 cursor-pointer flex gap-2 items-center"
                  onClick={() => {
                    axios
                      .post(api().logoutUser)
                      .catch(() => {})
                      .finally(() => {
                        localStorage.clear();
                        setDropdownOpen(false);
                        navigate("/login");
                      });
                  }}
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default AdminSidebar;
