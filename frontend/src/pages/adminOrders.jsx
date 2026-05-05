import React, { useEffect, useState, useMemo } from "react";
import api from "../utils/api";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../components/adminSidebar";

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [activeStatus, setActiveStatus] = useState("Pending");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(api().getOrders);
      if (res.data?.status && res.data.orders) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      toast.error("Failed to fetch orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await axios.patch(api().updateOrderStatus(orderId), {
        status: newStatus,
      });

      if (res.data?.status) {
        toast.success(res.data.message || "Order status updated successfully");
        setTimeout(() => fetchOrders(), 300);
      } else {
        toast.error(res.data?.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Status update error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update order status";
      toast.error(errorMessage);
      setTimeout(() => fetchOrders(), 500);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Confirmed: "bg-blue-100 text-blue-800",
      Shipped: "bg-purple-100 text-purple-800",
      "Out For Delivery": "bg-indigo-100 text-indigo-800",
      Delivered: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const ordersByStatus = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, status) => {
      acc[status] = orders.filter((o) => o.status === status);
      return acc;
    }, {});
  }, [orders]);

  const activeOrders = useMemo(() => {
    const list = ordersByStatus[activeStatus] || [];
    return [...list].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [ordersByStatus, activeStatus]);

  const activeLineItemCount = useMemo(() => {
    return activeOrders.reduce(
      (sum, o) => sum + (Array.isArray(o.items) ? o.items.length : 0),
      0,
    );
  }, [activeOrders]);

  const activeCustomerCount = useMemo(() => {
    const ids = new Set(
      activeOrders
        .map((o) => String(o.user?._id || o.user || ""))
        .filter(Boolean),
    );
    return ids.size;
  }, [activeOrders]);

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-gray-500">Loading orders...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-orange-600 mb-2">All Orders</h1>

        <div className="flex flex-wrap gap-2 mb-5">
          {STATUS_OPTIONS.map((status) => {
            const count = ordersByStatus[status]?.length ?? 0;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setActiveStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                  activeStatus === status
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                }`}
              >
                {status} <span className="opacity-90">({count} orders)</span>
              </button>
            );
          })}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center text-gray-500">
            No orders found
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-orange-50/50">
              <h2 className="text-lg font-bold text-gray-800">
                {activeStatus}
              </h2>
              <div className="flex flex-wrap gap-2 text-sm">
                <span
                  className={`px-3 py-1 rounded-full font-semibold ${getStatusColor(
                    activeStatus,
                  )}`}
                >
                  {activeOrders.length} orders
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-semibold">
                  {activeLineItemCount} products (lines)
                </span>
                <span className="px-3 py-1 rounded-full bg-white border border-orange-200 text-orange-800 font-semibold">
                  {activeCustomerCount} customers
                </span>
              </div>
            </div>

            <div className="p-0">
              {activeOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-10 px-4">
                  No orders in this status.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                      <tr>
                        <th
                          className="w-10 px-2 py-3 text-left"
                          aria-label="Expand"
                        />
                        <th className="px-3 py-3 text-left font-semibold">#</th>
                        <th className="px-3 py-3 text-left font-semibold">
                          Order / Ref
                        </th>
                        <th className="px-3 py-3 text-left font-semibold">
                          Customer
                        </th>
                        <th className="px-3 py-3 text-left font-semibold">
                          Date
                        </th>
                        <th className="px-3 py-3 text-right font-semibold">
                          Lines
                        </th>
                        <th className="px-3 py-3 text-right font-semibold">
                          Total
                        </th>
                        <th className="px-3 py-3 text-left font-semibold">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeOrders.map((order, idx) => {
                        const orderIdStr = String(order._id);
                        const shortId = orderIdStr.slice(-8).toUpperCase();
                        const displayNum = idx + 1;
                        const items = order.items || [];
                        const isExpanded = expandedOrderId === orderIdStr;
                        const total = Number(order.totalPrice) || 0;

                        return (
                          <React.Fragment key={orderIdStr}>
                            <tr className="bg-white hover:bg-orange-50/40 align-middle">
                              <td className="px-2 py-3">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandOrder(orderIdStr)}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                  aria-expanded={isExpanded}
                                  aria-label={
                                    isExpanded
                                      ? "Hide order details"
                                      : "Show order details"
                                  }
                                >
                                  <svg
                                    className={`h-5 w-5 transition-transform duration-200 ${
                                      isExpanded ? "rotate-180" : ""
                                    }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    aria-hidden
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </button>
                              </td>
                              <td className="px-3 py-3 font-semibold text-gray-900">
                                {displayNum}
                              </td>
                              <td className="px-3 py-3">
                                <div className="font-medium text-gray-900">
                                  #{displayNum}{" "}
                                  <span className="text-gray-500 font-normal">
                                    · {shortId}
                                  </span>
                                </div>
                                <div
                                  className="text-xs text-gray-500 font-mono truncate max-w-[200px]"
                                  title={orderIdStr}
                                >
                                  {orderIdStr}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-gray-800">
                                <div className="font-medium max-w-[180px] truncate">
                                  {order.user?.name || "—"}
                                </div>
                                <div className="text-xs text-gray-500 max-w-[200px] truncate">
                                  {order.user?.email || "—"}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                                {new Date(order.createdAt).toLocaleString()}
                              </td>
                              <td className="px-3 py-3 text-right text-gray-800">
                                {items.length}
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-orange-700 whitespace-nowrap">
                                Rs{" "}
                                {total.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${getStatusColor(
                                      order.status,
                                    )}`}
                                  >
                                    {order.status}
                                  </span>
                                  <select
                                    value={order.status}
                                    onChange={(e) =>
                                      handleStatusUpdate(
                                        order._id,
                                        e.target.value,
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2 py-1.5 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs bg-white min-w-[140px]"
                                  >
                                    {STATUS_OPTIONS.map((statusItem) => (
                                      <option
                                        key={statusItem}
                                        value={statusItem}
                                      >
                                        {statusItem}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-orange-50/50">
                                <td
                                  colSpan={8}
                                  className="px-4 py-4 border-t border-orange-100"
                                >
                                  <div className="overflow-x-auto rounded-xl border border-orange-100 bg-white">
                                    <table className="w-full min-w-[640px] text-sm">
                                      <thead className="bg-gray-50 text-gray-700">
                                        <tr>
                                          <th className="px-3 py-2 text-left">
                                            Image
                                          </th>
                                          <th className="px-3 py-2 text-left">
                                            Product
                                          </th>
                                          <th className="px-3 py-2 text-right">
                                            Unit price
                                          </th>
                                          <th className="px-3 py-2 text-right">
                                            Qty
                                          </th>
                                          <th className="px-3 py-2 text-right">
                                            Line total
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {items.map((item, lineIdx) => {
                                          const product = item?.product || {};
                                          const itemPrice = Number(
                                            item?.price ?? product?.price ?? 0,
                                          );
                                          const quantity = Number(
                                            item?.quantity ?? 0,
                                          );
                                          const lineTotal =
                                            itemPrice * quantity;
                                          const lineKey = `${orderIdStr}-${lineIdx}-${
                                            product?._id || "x"
                                          }`;

                                          return (
                                            <tr
                                              key={lineKey}
                                              className="hover:bg-orange-50/30"
                                            >
                                              <td className="px-3 py-2">
                                                {product?.image ? (
                                                  <img
                                                    src={product.image}
                                                    alt={product?.name || ""}
                                                    className="w-11 h-11 object-cover rounded-md border border-gray-200"
                                                  />
                                                ) : (
                                                  <div className="w-11 h-11 rounded-md bg-gray-100 border border-gray-200" />
                                                )}
                                              </td>
                                              <td className="px-3 py-2 font-medium text-gray-800">
                                                {product?.name ||
                                                  "Product unavailable"}
                                              </td>
                                              <td className="px-3 py-2 text-right text-gray-700">
                                                Rs{" "}
                                                {itemPrice.toLocaleString(
                                                  undefined,
                                                  {
                                                    maximumFractionDigits: 2,
                                                  },
                                                )}
                                              </td>
                                              <td className="px-3 py-2 text-right">
                                                {quantity}
                                              </td>
                                              <td className="px-3 py-2 text-right font-semibold text-orange-600">
                                                Rs{" "}
                                                {lineTotal.toLocaleString(
                                                  undefined,
                                                  {
                                                    maximumFractionDigits: 2,
                                                  },
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600 px-1">
                                    <span>
                                      Subtotal: Rs{" "}
                                      {(
                                        Number(order.subtotal) || 0
                                      ).toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}
                                    </span>
                                    <span>
                                      Discount: Rs{" "}
                                      {(
                                        Number(order.discount) || 0
                                      ).toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}
                                    </span>
                                    <span>
                                      Tax: Rs{" "}
                                      {(Number(order.tax) || 0).toLocaleString(
                                        undefined,
                                        {
                                          maximumFractionDigits: 2,
                                        },
                                      )}
                                    </span>
                                    <span>
                                      Shipping: Rs{" "}
                                      {(
                                        Number(order.shippingFee) || 0
                                      ).toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>

                                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                      <p className="font-semibold text-gray-800 mb-2">
                                        Customer
                                      </p>
                                      <p>
                                        <span className="font-medium">
                                          Name:
                                        </span>{" "}
                                        {order.user?.name || "N/A"}
                                      </p>
                                      <p>
                                        <span className="font-medium">
                                          Email:
                                        </span>{" "}
                                        {order.user?.email || "N/A"}
                                      </p>
                                      <p>
                                        <span className="font-medium">
                                          Phone:
                                        </span>{" "}
                                        {order.user?.phone || "N/A"}
                                      </p>
                                      <p>
                                        <span className="font-medium">
                                          Profile address:
                                        </span>{" "}
                                        {order.user?.address || "N/A"}
                                      </p>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                      <p className="font-semibold text-gray-800 mb-2">
                                        Shipping address
                                      </p>
                                      <p>
                                        {order.shippingAddress?.address ||
                                          "N/A"}
                                      </p>
                                      <p>
                                        {order.shippingAddress?.city || ""}{" "}
                                        {order.shippingAddress?.postalCode ||
                                          ""}
                                      </p>
                                      <p>
                                        {order.shippingAddress?.country || ""}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
