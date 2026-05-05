import React, { useEffect, useState } from "react";
import api from "../utils/api";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../utils/LanguageContext";
import { getLocalizedName } from "../utils/productDisplay";

function Checkout() {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const displayOrNotProvided = (value) =>
    !value || value === "Not provided" ? t("notProvided") : value;

  // Fetch cart and user profile
  const fetchCartAndUser = async () => {
    try {
      const isLoggedIn = !!localStorage.getItem("user");
      if (!isLoggedIn) {
        navigate("/login");
        return;
      }

      // Fetch cart
      const cartRes = await axios.get(api().getCart);
      setCart(cartRes.data?.cart || cartRes.data || { items: [] });

      // Fetch user profile
      const userRes = await axios.get(api().getUserProfile);

      if (userRes.data?.status && userRes.data.user) {
        const userData = {
          name: userRes.data.user.name || "Not provided",
          email: userRes.data.user.email || "Not provided",
          phone: userRes.data.user.phone || "Not provided",
          address: userRes.data.user.address || "Not provided",
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        // fallback to localStorage
        const localUser = JSON.parse(localStorage.getItem("user")) || {};
        setUser({
          name: localUser.name || "Not provided",
          email: localUser.email || "Not provided",
          phone: localUser.phone || "Not provided",
          address: localUser.address || "Not provided",
        });
      }
    } catch (err) {
      console.error("Failed to fetch cart or user:", err);
      toast.error(t("failedToLoadCartUser"));

      const localUser = JSON.parse(localStorage.getItem("user")) || {};
      setUser({
        name: localUser.name || "Not provided",
        email: localUser.email || "Not provided",
        phone: localUser.phone || "Not provided",
        address: localUser.address || "Not provided",
      });
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartAndUser();
  }, []);

  // Safe subtotal calculation
  const subtotal = (cart.items || []).reduce(
    (sum, it) => sum + (it.product?.price || it.price || 0) * (it.quantity || 1),
    0
  );

  const shipping = 200;
  const tax = 100;
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = async () => {
    setPlacing(true);

    if ((cart.items || []).length === 0) {
      toast.error(t("cartEmptyToast"));
      navigate("/shopping-cart");
      setPlacing(false);
      return;
    }

    if (!user || !user.address || user.address === "Not provided" || user.address.trim() === "") {
      toast.error(t("updateAddressBeforeOrder"));
      navigate("/user-profile");
      setPlacing(false);
      return;
    }

    try {
      // Ensure address is not empty
      const address = user.address.trim();
      if (!address || address === "Not provided") {
        toast.error(t("validAddressRequired"));
        setPlacing(false);
        return;
      }

      const res = await axios.post(api().createOrder, {
        shippingAddress: {
          address: address,
          city: "City",
          postalCode: "00000",
          country: "Pakistan",
        },
        paymentMethod: "COD",
      });

      if (res.data?.order?._id) {
        toast.success(t("orderPlacedSuccess"));
        navigate(`/order-summary/${res.data.order._id}`);
      } else {
        toast.error(res.data?.message || t("failedPlaceOrder"));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t("failedPlaceOrder"));
    } finally {
      setPlacing(false);
    }
  };

  if (loading)
    return <p className="p-8 text-center text-gray-500">{t("loading")}</p>;

  if (!user)
    return (
      <p className="p-8 text-center text-gray-500">{t("loadingUserDetails")}</p>
    );

  return (
    <div className="min-h-screen p-6 bg-orange-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Customer Details */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-orange-200">
          <h2 className="text-2xl font-bold text-orange-600 mb-4">
            {t("customerDetails")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">{t("nameField")}</p>
              <p className="text-gray-600">{displayOrNotProvided(user.name)}</p>
            </div>
            <div>
              <p className="font-semibold">{t("email")}</p>
              <p className="text-gray-600">{displayOrNotProvided(user.email)}</p>
            </div>
            <div>
              <p className="font-semibold">{t("phoneField")}</p>
              <p className="text-gray-600">{displayOrNotProvided(user.phone)}</p>
            </div>
            <div>
              <p className="font-semibold">{t("addressField")}</p>
              <p className="text-gray-600">
                {displayOrNotProvided(user.address)}
              </p>
            </div>
          </div>

          {(user.phone === "Not provided" ||
            user.address === "Not provided") && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 mb-2">
                ⚠️ {t("profileIncompleteWarning")}
              </p>
              <button
                onClick={() => navigate("/user-profile")}
                className="text-orange-600 hover:text-orange-700 font-semibold underline"
              >
                {t("updateProfile")}
              </button>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-orange-200">
          <h2 className="text-2xl font-bold text-orange-600 mb-4">
            {t("orderDetailsHeading")}
          </h2>
          <div className="space-y-3">
            {(cart.items || []).map((it, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="font-semibold">
                    {getLocalizedName(it.product, language) || t("product")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("qtyLabel")} {it.quantity}
                  </p>
                </div>
                <p className="font-semibold">
                  Rs{" "}
                  {(
                    (it.product?.price || it.price || 0) * it.quantity
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-gray-300 pt-4 space-y-2 text-gray-800">
            <div className="flex justify-between">
              {t("subtotal")}: Rs {subtotal.toLocaleString()}
            </div>
            <div className="flex justify-between">
              {t("shipping")}: Rs {shipping.toLocaleString()}
            </div>
            <div className="flex justify-between">
              {t("tax")}: Rs {tax.toLocaleString()}
            </div>
            <div className="flex justify-between font-bold text-lg">
              {t("total")}: Rs {total.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Place Order */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-orange-200 text-center">
          <p className="text-gray-700 mb-4">{t("reviewOrderHint")}</p>
          <button
            onClick={handlePlaceOrder}
            disabled={
              placing || !user.address || user.address === "Not provided"
            }
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placing ? t("placingOrder") : t("placeOrder")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
