import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../utils/api";
import { useLanguage } from "../utils/LanguageContext";
import { getLocalizedName } from "../utils/productDisplay";

export default function OrderTracking() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const id = qs.get("id");

    const fetchOrder = async () => {
      setLoading(true);
      try {
        let res;
        if (id) {
          res = await axios.get(api().getOrder(id));
          setOrder(res.data?.order || res.data);
        } else {
          const base = new URL(api().getOrders).origin;
          res = await axios.get(`${base}/api/orders/myorders`);
          const list = res.data?.orders || res.data;
          if (Array.isArray(list) && list.length > 0) {
            // pick most recent
            const recent = list[list.length - 1];
            setOrder(recent);
            // update URL with id for shareability
            navigate(`/order-tracking?id=${recent._id}`, { replace: true });
          } else {
            setError(t("noOrdersForUser"));
          }
        }
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || err.message || t("failedToLoadOrder"),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [location.search, navigate, t]);

  const renderStep = (title, subtitle, done) => (
    <li
      className={`p-4 rounded-xl shadow-sm ${
        done
          ? "bg-orange-50 hover:bg-orange-100"
          : "bg-gray-100 hover:bg-gray-200"
      } transition`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full shadow ${
          done ? "bg-orange-200" : "bg-gray-300"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <h4 className="font-semibold text-slate-900 mt-3">{title}</h4>
      {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
    </li>
  );

  if (loading) {
    return <div className="p-8 text-center">{t("loading")}</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  if (!order) {
    return <div className="p-8 text-center">{t("noOrderData")}</div>;
  }

  const steps = [
    { key: "Pending", title: t("trackingOrderPlaced"), time: order.createdAt },
    {
      key: "Shipped",
      title: t("trackingWarehouse"),
      time: order.updatedAt,
    },
    {
      key: "OutForDelivery",
      title: t("trackingOutForDelivery"),
      time: null,
    },
    { key: "Delivered", title: t("trackingDelivered"), time: null },
  ];

  const statusOrder = ["Pending", "Shipped", "Delivered"];
  const currentIndex = Math.max(0, statusOrder.indexOf(order.status));

  return (
    <div className="p-6 bg-orange-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-orange-500">
        <h1 className="text-2xl font-bold text-orange-600">
          {t("orderTrackingTitle")}
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          {t("trackingIdLabel")} #{order._id}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-xl mt-8">
        <h2 className="text-xl font-semibold text-orange-600 mb-6">
          {t("orderStatusTimeline")}
        </h2>

        <ul className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {steps.map((s, idx) => {
            const done = idx <= currentIndex;
            const time =
              idx === 0 ? order.createdAt : done ? order.updatedAt : s.time;
            const subtitle = time
              ? new Date(time).toLocaleString()
              : idx === 2 && done
                ? t("trackingCourierOnWay")
                : idx === 2
                  ? t("trackingCourierProcessing")
                  : idx === 3
                    ? t("trackingExpectedSoon")
                    : "";
            return (
              <React.Fragment key={s.key}>
                {renderStep(s.title, subtitle, done)}
              </React.Fragment>
            );
          })}
        </ul>
      </div>

      {/* Product List & Billing */}
      <div className="grid lg:grid-cols-2 gap-8 mt-8">
        {/* Products Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-orange-600 border-b pb-2">
            {t("productsHeading")}
          </h3>

          <div className="space-y-5 mt-6">
            {(order.items || []).map((item) => (
              <div
                key={item._id || item.product._id}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition"
              >
                <div className="col-span-2 flex items-center gap-4">
                  <img
                    src={
                      item.product?.image ||
                      item.image ||
                      "https://via.placeholder.com/80"
                    }
                    alt={
                      getLocalizedName(item.product, language) ||
                      item.name ||
                      t("product")
                    }
                    className="w-20 h-20 object-contain rounded-lg bg-gray-100 p-2"
                  />
                  <div>
                    <h4 className="font-medium text-slate-900">
                      {getLocalizedName(item.product, language) ||
                        item.name ||
                        t("product")}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      {t("qtyLabel")} {item.quantity || 1}
                    </p>
                  </div>
                </div>
                <p className="text-right font-semibold text-orange-600">
                  Rs{" "}
                  {(
                    (item.price || item.product?.price || 0) *
                    (item.quantity || 1)
                  ).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-orange-600 border-b pb-2">
            {t("billingDetails")}
          </h3>

          <ul className="mt-6 text-sm font-medium space-y-4">
            <li className="flex justify-between text-slate-700">
              {t("subtotal")}{" "}
              <span className="text-slate-900 font-semibold">
                Rs{" "}
                {(order.items || [])
                  .reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0)
                  .toFixed(2)}
              </span>
            </li>
            <li className="flex justify-between text-slate-700">
              {t("shipping")}{" "}
              <span className="text-slate-900 font-semibold">
                Rs{" "}
                {order.shippingFee?.toFixed(2) ||
                  order.shippingPrice?.toFixed(2) ||
                  "0.00"}
              </span>
            </li>
            <li className="flex justify-between text-slate-700">
              {t("tax")}{" "}
              <span className="text-slate-900 font-semibold">
                Rs{" "}
                {order.tax?.toFixed(2) || order.taxPrice?.toFixed(2) || "0.00"}
              </span>
            </li>

            <hr />

            <li className="flex justify-between text-lg text-slate-900 font-bold">
              {t("total")}{" "}
              <span>Rs {order.totalPrice.toFixed(2)}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
