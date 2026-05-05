import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import axios from "axios";
import { toast } from "react-toastify";
import { useLanguage } from "../utils/LanguageContext";
import { getLocalizedName } from "../utils/productDisplay";

function OrderSummary() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(api().getOrder(id));
        setOrder(res.data?.order || res.data);
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || t("fetchOrderFailed"));
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id, t]);

  if (loading) {
    return <p className="p-8 text-center">{t("loadingOrder")}</p>;
  }
  if (!order) {
    return (
      <p className="p-8 text-center text-red-500">{t("orderNotFound")}</p>
    );
  }

  const items = order.items || [];
  const subtotal = order.subtotal || 0;
  const shipping = order.shippingFee ?? order.shippingPrice ?? 200;
  const tax = order.tax ?? order.taxPrice ?? 400;
  const total = order.totalPrice || subtotal + shipping + tax;
  const user = order.user || {};

  return (
    <div className="min-h-screen p-6 bg-orange-50">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-orange-600 mb-4">{t("thankYou")}</h2>
        <p className="mb-4 text-gray-700">{t("orderPlacedBody")}</p>

        <h3 className="text-lg font-semibold mb-2">{t("customerDetails")}</h3>
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="mb-1">
            <strong>{t("nameField")}:</strong> {user.name || t("naLabel")}
          </p>
          <p className="mb-1">
            <strong>{t("email")}:</strong> {user.email || t("naLabel")}
          </p>
          <p className="mb-1">
            <strong>{t("phoneField")}:</strong> {user.phone || t("naLabel")}
          </p>
          <p className="mb-1">
            <strong>{t("addressField")}:</strong>{" "}
            {user.address || t("naLabel")}
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-4 mb-2">
          {t("orderDetailsHeading")}
        </h3>
        {items.map((it, idx) => (
          <div
            key={idx}
            className="flex justify-between py-2 border-b border-gray-200"
          >
            <div>
              <p className="font-medium">
                {getLocalizedName(it.product, language) || t("product")}
              </p>
              <p className="text-sm text-gray-500">
                {t("qtyLabel")} {it.quantity}
              </p>
            </div>
            <p className="font-semibold">
              Rs{" "}
              {(it.price * it.quantity).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        ))}

        <div className="mt-4 border-t border-gray-300 pt-4">
          <div className="flex justify-between">
            {t("subtotal")}: Rs {subtotal.toLocaleString()}
          </div>
          <div className="flex justify-between">
            {t("shipping")}: Rs {Number(shipping).toLocaleString()}
          </div>
          <div className="flex justify-between">
            {t("tax")}: Rs {Number(tax).toLocaleString()}
          </div>
          <div className="flex justify-between font-bold text-lg mt-2">
            {t("total")}: Rs {Number(total).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSummary;
