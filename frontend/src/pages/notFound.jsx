import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useLanguage } from "../utils/LanguageContext";

function NotFound() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const isLoggedIn = !!localStorage.getItem("user");
        if (!isLoggedIn) {
          setLoading(false);
          return;
        }

        const response = await fetch(api().getAcess, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        if (result.status && result.isAdmin) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Error checking user role:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  const handleNavigate = () => {
    const isLoggedIn = !!localStorage.getItem("user");

    if (!isLoggedIn) {
      navigate("/login");
    } else if (isAdmin) {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-orange-50 items-center justify-center">
        <div className="text-orange-600 font-semibold">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-orange-50">
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center border-l-4 border-orange-500">
          <h1 className="text-6xl font-bold text-orange-600 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            {t("pageNotFound")}
          </h2>
          <p className="text-slate-500 mb-6">{t("pageNotFoundBody")}</p>

          {localStorage.getItem("user") ? (
            <div className="space-y-3">
              <button
                onClick={handleNavigate}
                className="w-full px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg shadow hover:bg-orange-700 transition"
              >
                {isAdmin ? t("goToAdminDashboard") : t("goToHome")}
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                {t("goBack")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => navigate("/login")}
                className="w-full px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg shadow hover:bg-orange-700 transition"
              >
                {t("goToLogin")}
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                {t("goToHome")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default NotFound;
