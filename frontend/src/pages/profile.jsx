import React, { useEffect, useState } from "react";
import api from "../utils/api";
import axios from "axios";
import { toast } from "react-toastify";
import { useLanguage } from "../utils/LanguageContext";

function Profile() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(api().getUserProfile);
      if (res.data?.status && res.data?.user) {
        setUser(res.data.user);
        setFormData({
          name: res.data.user.name || "",
          email: res.data.user.email || "",
          phone: res.data.user.phone || "",
          address: res.data.user.address || "",
        });
      } else {
        toast.error(t("failedFetchUserDetails"));
      }
    } catch {
      toast.error(t("failedFetchUserDetails"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(api().updateUserProfile, formData);
      if (res.data?.status) {
        toast.success(t("profileUpdatedSuccess"));
        setEditing(false);
        fetchUser();
      } else {
        toast.error(res.data.message || t("failedUpdateProfile"));
      }
    } catch {
      toast.error(t("failedUpdateProfile"));
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-orange-500 font-bold">
        {t("loading")}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-10 text-center text-red-500 font-semibold">
        {t("userNotFound")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-6 md:p-10 border-l-4 border-orange-500">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-orange-600 flex items-center justify-center text-white text-3xl font-bold">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>

        {/* User Details */}
        <div className="mt-8 space-y-4">
          {/* Name */}
          <div className="flex flex-col">
            <label className="text-gray-600 font-semibold">{t("nameField")}</label>
            {editing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 border border-orange-200 bg-orange-50 p-2 rounded-lg outline-none focus:ring-2 focus:ring-orange-300"
              />
            ) : (
              <p className="mt-1 text-gray-800">{user.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label className="text-gray-600 font-semibold">{t("email")}</label>
            {editing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 border border-orange-200 bg-orange-50 p-2 rounded-lg outline-none focus:ring-2 focus:ring-orange-300"
              />
            ) : (
              <p className="mt-1 text-gray-800">{user.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="flex flex-col">
            <label className="text-gray-600 font-semibold">{t("phoneField")}</label>
            {editing ? (
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1 border border-orange-200 bg-orange-50 p-2 rounded-lg outline-none focus:ring-2 focus:ring-orange-300"
              />
            ) : (
              <p className="mt-1 text-gray-800">
                {user.phone || t("notProvided")}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="flex flex-col">
            <label className="text-gray-600 font-semibold">
              {t("addressField")}
            </label>
            {editing ? (
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="mt-1 border border-orange-200 bg-orange-50 p-2 rounded-lg outline-none focus:ring-2 focus:ring-orange-300"
                rows={3}
              />
            ) : (
              <p className="mt-1 text-gray-800">
                {user.address || t("notProvided")}
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-center gap-4">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-orange-600 text-white py-2 px-6 rounded-xl font-semibold hover:bg-orange-700 transition"
              >
                {t("save")}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-gray-200 text-gray-700 py-2 px-6 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                {t("cancel")}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="bg-orange-600 text-white py-2 px-6 rounded-xl font-semibold hover:bg-orange-700 transition"
            >
              {t("editProfile")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default Profile;
