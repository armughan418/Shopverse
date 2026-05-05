import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-toastify";
import { useLanguage } from "../utils/LanguageContext";

function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning(t("input Fields Cannot Be Empty"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(api().loginUser, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      setLoading(false);

      if (!response.ok) {
        throw new Error(result.message || t("loginFailed"));
      }

      if (result.status) {
        toast.success(result.message);

        // Determine user role from response
        const userRole = result.user?.role || "user";
        const isAdmin = result.user?.isAdmin || userRole === "admin";

        if (result.user) {
          const userData = {
            name: result.user.name || "",
            email: result.user.email || "",
            phone: result.user.phone || "",
            address: result.user.address || "",
            role: userRole,
            isAdmin: isAdmin,
          };
          localStorage.setItem("user", JSON.stringify(userData));
        }

        // Redirect based on user role
        if (isAdmin) {
          navigate("/admin-dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      setLoading(false);
      console.error("Login Error:", error);
      toast.error(error.message || t("serverErrorTryAgain"));
    }

    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-white to-orange-200 p-6">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 border border-orange-200">
        {/* Header */}
        <h2 className="text-3xl font-extrabold text-orange-700 text-center mb-6">
          {t("welcomeBack")}
        </h2>
        <p className="text-center text-slate-600 mb-8">
          {t("loginToDashboard")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              {t("emailAddress")}
            </label>
            <input
              type="email"
              placeholder={t("enterEmail")}
              className="w-full px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 text-slate-800 
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 
              transition shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              {t("password")}
            </label>
            <input
              type="password"
              placeholder={t("enterPassword")}
              className="w-full px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 text-slate-800 
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 
              transition shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 text-white font-semibold py-3 rounded-xl
            shadow-lg hover:bg-orange-700 hover:shadow-xl transition-transform duration-200 
            hover:scale-[1.02]"
          >
            {loading ? t("loading") : t("login")}
          </button>

          <div className="flex justify-between pt-2 text-sm">
            <button
              type="button"
              className="text-orange-600 hover:text-orange-700 font-medium transition"
              onClick={() => navigate("/signup")}
            >
              {t("createAccount")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default Login;
