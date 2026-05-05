import React, { useEffect, useState } from "react";
import api from "../utils/api";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../utils/LanguageContext";

function ShoppingCart() {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const getLocalizedName = (product) =>
    language === "ur" && product?.nameUrdu ? product.nameUrdu : product?.name;
  const getPrimaryMedia = (product) =>
    Array.isArray(product?.media) && product.media.length > 0
      ? [...product.media].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0]
      : product?.image
        ? { url: product.image, type: "image" }
        : null;

  // Fetch cart items safely
  const fetchCart = async () => {
    try {
      const res = await axios.get(api().getCart);
      setCart({ items: res.data?.cart?.items || [] });
    } catch (err) {
      console.error(err);
      toast.error(t("failedToLoadCart"));
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Update quantity
  const handleUpdateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
    try {
      await axios.patch(api().updateCartItem, { productId, quantity });
      fetchCart();
      // Dispatch event to update cart count in navbar
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error(err);
      toast.error(t("failedToUpdateQuantity"));
    }
  };

  // Remove item from cart
  const handleRemoveItem = async (productId) => {
    try {
      await axios.delete(api().removeFromCart(productId));
      toast.success(t("itemRemovedFromCart"));
      fetchCart();
      // Dispatch event to update cart count in navbar
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t("failedToRemoveItem"));
    }
  };

  const subtotal = (cart.items || []).reduce(
    (sum, it) => sum + (it.product?.price || it.price || 0) * it.quantity,
    0
  );

  const shipping = 200;
  const tax = 100;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen p-6 bg-orange-50">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 space-y-6 border-l-4 border-orange-500">
          <h2 className="text-2xl font-bold text-orange-600 mb-4">
            {t("shoppingCart")}
          </h2>

          {loading ? (
            <p className="text-gray-400">{t("loadingCart")}</p>
          ) : (cart.items || []).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg mb-4">{t("emptyCart")}</p>
              <button
                onClick={() => navigate("/")}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
              >
                {t("continueShopping")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {(cart.items || []).map((it) => (
                <div
                  key={it.product?._id || it._id}
                  className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-gray-50 shadow-sm hover:shadow-md transition"
                >
                  <div className="w-28 h-28 bg-white rounded-lg p-2 flex items-center justify-center border border-gray-200">
                    {getPrimaryMedia(it.product)?.type === "video" ? (
                      <video
                        src={getPrimaryMedia(it.product)?.url}
                        className="object-contain h-full w-full"
                        muted
                      />
                    ) : (
                      <img
                        src={getPrimaryMedia(it.product)?.url || it.product?.image}
                        alt={getLocalizedName(it.product)}
                        className="object-contain h-full w-full"
                      />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 w-full">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {getLocalizedName(it.product) || t("unknownProduct")}
                      </h4>
                      <div className="flex items-center mt-2 gap-2">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              it.product?._id,
                              it.quantity - 1
                            )
                          }
                          className="px-2 py-1 bg-orange-100 rounded text-orange-600 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={it.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(
                              it.product?._id,
                              Math.max(1, Number(e.target.value))
                            )
                          }
                          className="w-12 text-center border rounded"
                        />
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              it.product?._id,
                              it.quantity + 1
                            )
                          }
                          className="px-2 py-1 bg-orange-100 rounded text-orange-600 font-bold"
                        >
                          +
                        </button>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(it.product?._id)}
                          className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          {t("remove")}
                        </button>
                      </div>
                    </div>

                    <div className="text-lg font-semibold text-orange-600">
                      Rs{" "}
                      {(
                        (it.product?.price || it.price || 0) * it.quantity
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-orange-500 h-max sticky top-24">
          <h3 className="text-xl font-semibold text-orange-600 mb-4">
            {t("orderSummaryHeading")}
          </h3>
          <ul className="space-y-3 text-gray-800">
            <li className="flex justify-between text-sm">
              <span>{t("subtotal")}</span>
              <span>
                Rs{" "}
                {subtotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </li>
            <li className="flex justify-between text-sm">
              <span>{t("shipping")}</span>
              <span>Rs {shipping.toLocaleString()}</span>
            </li>
            <li className="flex justify-between text-sm">
              <span>{t("tax")}</span>
              <span>Rs {tax.toLocaleString()}</span>
            </li>
            <li className="flex justify-between font-semibold text-gray-900 text-lg border-t border-gray-200 pt-2 mt-2">
              <span>{t("total")}</span>
              <span>
                Rs{" "}
                {total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </li>
          </ul>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => navigate("/checkout")}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition"
            >
              {t("continueToCheckout")}
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 border border-gray-300 text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition"
            >
              {t("continueShopping")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCart;
