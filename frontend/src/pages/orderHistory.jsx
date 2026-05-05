import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import axios from "axios";
import { toast } from "react-toastify";
import { useLanguage } from "../utils/LanguageContext";

function getStatusColor(status) {
  const colors = {
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    Shipped: "bg-purple-100 text-purple-800 border-purple-200",
    "Out For Delivery": "bg-indigo-100 text-indigo-800 border-indigo-200",
    Delivered: "bg-green-100 text-green-800 border-green-200",
    Cancelled: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
}

function formatMoney(n) {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function OrderHistory() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get(api().getMyOrders);
        if (res.data?.status && Array.isArray(res.data.orders)) {
          setOrders(res.data.orders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        toast.error(
          err.response?.data?.message || t("failedToLoadOrders"),
        );
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once; t() for toasts only
  }, []);

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 pt-4 px-4 pb-10">
        <div className="max-w-5xl mx-auto py-16 text-center text-gray-600">
          {t("loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pt-4 px-3 sm:px-4 pb-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-orange-600">
            {t("myOrders")}
          </h1>
          <p className="text-sm text-gray-600 mt-1">{t("orderHistorySubtitle")}</p>
        </div>

        {sortedOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-10 text-center text-gray-600">
            <p className="mb-4">{t("noOrdersYet")}</p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition"
            >
              {t("allProducts")}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedOrders.map((order, orderIdx) => {
              const orderIdStr = String(order._id);
              const shortRef = orderIdStr.slice(-8).toUpperCase();
              const items = order.items || [];
              const status = order.status || "Pending";
              const total = Number(order.totalPrice) || 0;

              return (
                <article
                  key={orderIdStr}
                  className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between px-4 py-4 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {t("orderSingular")}{" "}
                        <span className="text-orange-700">#{orderIdx + 1}</span>
                        <span className="text-gray-500 font-normal">
                          {" "}
                          · Ref {shortRef}
                        </span>
                      </p>
                      <p
                        className="text-xs text-gray-500 font-mono truncate max-w-[260px] sm:max-w-md mt-0.5"
                        title={orderIdStr}
                      >
                        {orderIdStr}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          status,
                        )}`}
                      >
                        {t("orderStatus")}: {status}
                      </span>
                      <span className="text-sm font-bold text-orange-700 whitespace-nowrap">
                        {t("total")}: Rs {formatMoney(total)}
                      </span>
                      <Link
                        to={`/order-summary/${order._id}`}
                        className="text-xs sm:text-sm font-semibold text-orange-600 hover:text-orange-800 underline underline-offset-2"
                      >
                        {t("viewDetails")}
                      </Link>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <p className="p-4 text-center text-gray-500 text-sm">
                      {t("noItemsInOrder")}
                    </p>
                  ) : (
                    <>
                      {/* Desktop / tablet: table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                          <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-3 text-left font-semibold w-20">
                                {t("image")}
                              </th>
                              <th className="px-3 py-3 text-left font-semibold">
                                {t("product")}
                              </th>
                              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">
                                {t("unitPrice")}
                              </th>
                              <th className="px-3 py-3 text-right font-semibold">
                                {t("qty")}
                              </th>
                              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">
                                {t("lineTotal")}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {items.map((item, lineIdx) => {
                              const product = item?.product;
                              const name =
                                product?.name ||
                                (typeof product === "object" && product?.title) ||
                                t("productUnavailable");
                              const img =
                                product?.image ||
                                "https://via.placeholder.com/80?text=—";
                              const unit = Number(
                                item?.price ?? product?.price ?? 0,
                              );
                              const qty = Number(item?.quantity ?? 0);
                              const lineTotal = unit * qty;
                              const lineKey = `${orderIdStr}-${lineIdx}-${
                                product?._id || "x"
                              }`;

                              return (
                                <tr key={lineKey} className="hover:bg-orange-50/40">
                                  <td className="px-3 py-3 align-middle">
                                    <img
                                      src={img}
                                      alt={name}
                                      className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                                    />
                                  </td>
                                  <td className="px-3 py-3 font-medium text-gray-900 align-middle">
                                    {name}
                                  </td>
                                  <td className="px-3 py-3 text-right text-gray-800 align-middle whitespace-nowrap">
                                    Rs {formatMoney(unit)}
                                  </td>
                                  <td className="px-3 py-3 text-right align-middle">
                                    {qty}
                                  </td>
                                  <td className="px-3 py-3 text-right font-semibold text-orange-700 align-middle whitespace-nowrap">
                                    Rs {formatMoney(lineTotal)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile: stacked cards */}
                      <ul className="sm:hidden divide-y divide-gray-100">
                        {items.map((item, lineIdx) => {
                          const product = item?.product;
                          const name =
                            product?.name ||
                            (typeof product === "object" && product?.title) ||
                            t("productUnavailable");
                          const img =
                            product?.image ||
                            "https://via.placeholder.com/80?text=—";
                          const unit = Number(
                            item?.price ?? product?.price ?? 0,
                          );
                          const qty = Number(item?.quantity ?? 0);
                          const lineTotal = unit * qty;
                          const lineKey = `${orderIdStr}-m-${lineIdx}-${
                            product?._id || "x"
                          }`;

                          return (
                            <li
                              key={lineKey}
                              className="flex gap-3 p-4 items-start"
                            >
                              <img
                                src={img}
                                alt={name}
                                className="w-16 h-16 shrink-0 object-cover rounded-lg border border-gray-200"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 text-sm leading-snug">
                                  {name}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {t("unitPrice")}: Rs{" "}
                                  {formatMoney(unit)} × {qty}
                                </p>
                                <p className="text-sm font-bold text-orange-700 mt-1">
                                  {t("lineTotal")}: Rs{" "}
                                  {formatMoney(lineTotal)}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}

                  <div className="px-4 py-3 bg-gray-50 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100">
                    <span>
                      {t("subtotal")}: Rs{" "}
                      {formatMoney(order.subtotal)}
                    </span>
                    <span>
                      {t("discount")}: Rs{" "}
                      {formatMoney(order.discount)}
                    </span>
                    <span>
                      {t("tax")}: Rs {formatMoney(order.tax)}
                    </span>
                    <span>
                      {t("shipping")}: Rs{" "}
                      {formatMoney(order.shippingFee)}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;
