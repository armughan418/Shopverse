import api from "../utils/api";
import { Link } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import { FaChartBar, FaUsers, FaShoppingCart, FaStar } from "react-icons/fa";
import { Download, ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import AdminLayout from "../components/adminSidebar";
import { toast } from "react-toastify";
import {
  downloadCurrentMonthReport,
  downloadYearlyReport,
  downloadEntireReport,
} from "../utils/adminReportPdf";

function formatTooltipRs(value) {
  const n = Number(value) || 0;
  return [
    "Rs " +
      n.toLocaleString("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    "Sales",
  ];
}

export default function AdminDashboard() {
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const reportMenuRef = useRef(null);

  const ordersUrl = api().getOrders;

  const runOrderPdf = async (fn) => {
    try {
      setPdfGenerating(true);
      setReportMenuOpen(false);
      await fn(stats, ordersUrl);
      toast.success("PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "PDF failed — check admin login");
    } finally {
      setPdfGenerating(false);
    }
  };

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    currentMonthSales: 0,
    currentMonthSalesByDay: [],
    ordersByStatus: {},
    salesByMonth: [],
    topProducts: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await fetch(api().adminStat, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        let statsData;
        try {
          statsData = await statsRes.json();
        } catch {
          statsData = { status: false };
        }

        if (statsData.status) {
          setStats({
            totalOrders: statsData.totalOrders || 0,
            totalUsers: statsData.totalUsers || 0,
            totalProducts: statsData.totalProducts || 0,
            totalSales: statsData.totalSales || 0,
            currentMonthSales: statsData.currentMonthSales || 0,
            currentMonthSalesByDay: statsData.currentMonthSalesByDay || [],
            ordersByStatus: statsData.ordersByStatus || {},
            salesByMonth: statsData.salesByMonth || [],
            topProducts: statsData.topProducts || [],
          });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (reportMenuRef.current && !reportMenuRef.current.contains(e.target)) {
        setReportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const revenueMonthLabel = useMemo(() => {
    return new Date().toLocaleString("en-PK", {
      month: "long",
      year: "numeric",
    });
  }, []);

  const pieData = useMemo(() => {
    return (stats.topProducts || []).map((p) => ({
      name: p.name || "Unknown",
      value: p.quantitySold || 0,
    }));
  }, [stats.topProducts]);

  const yearlySalesData = stats.salesByMonth || [];

  const pieOrangeShades = [
    "#ea580c",
    "#f97316",
    "#fb923c",
    "#fdba74",
    "#fed7aa",
  ];

  const statusCards = [
    "Pending",
    "Confirmed",
    "Shipped",
    "Out For Delivery",
    "Delivered",
    "Cancelled",
  ];

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
        {[
          {
            title: "Total Orders",
            value: stats.totalOrders,
            icon: <FaShoppingCart />,
          },
          {
            title: "Total Users",
            value: stats.totalUsers,
            icon: <FaUsers />,
          },
          {
            title: "Total Products",
            value: stats.totalProducts,
            icon: <FaStar />,
          },
          {
            title: "Total Sales",
            value: "Rs " + stats.totalSales,
            icon: <FaChartBar />,
          },
        ].map((item, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-orange-500 relative"
          >
            <h3 className="text-gray-500 text-sm">{item.title}</h3>
            <p className="text-3xl font-extrabold mt-2 text-orange-600">
              {item.value}
            </p>
            <div className="absolute right-6 top-6 text-3xl text-orange-300">
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-4 text-orange-600">
            Order Status Stats
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {statusCards.map((status) => (
              <div key={status} className="bg-orange-50 p-3 rounded-xl">
                <p>{status}</p>
                <p className="text-xl font-bold">
                  {stats.ordersByStatus?.[status] || 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl xl:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-semibold text-orange-600">
                Monthly revenue
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Entire Month Sales Report ({revenueMonthLabel})
              </p>
            </div>
            <div className="relative shrink-0" ref={reportMenuRef}>
              <button
                type="button"
                disabled={pdfGenerating}
                onClick={() => setReportMenuOpen((o) => !o)}
                className="inline-flex items-center gap-2 bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-orange-700 shadow-md transition disabled:opacity-60"
              >
                <Download size={18} />
                {pdfGenerating ? "Building PDF…" : "Download report"}
                <ChevronDown
                  size={16}
                  className={`transition ${reportMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
              {reportMenuOpen && !pdfGenerating && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-orange-100 rounded-xl shadow-xl z-30 overflow-hidden">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-orange-50 border-b border-orange-50"
                    onClick={() => runOrderPdf(downloadCurrentMonthReport)}
                  >
                    Current month — full orders (PDF)
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-orange-50 border-b border-orange-50"
                    onClick={() => runOrderPdf(downloadYearlyReport)}
                  >
                    Yearly — full orders (PDF)
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-orange-50"
                    onClick={() => runOrderPdf(downloadEntireReport)}
                  >
                    All orders — complete data (PDF)
                  </button>
                </div>
              )}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stats.currentMonthSalesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={formatTooltipRs}
                labelFormatter={(d) => `Day ${d}`}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #fed7aa",
                }}
              />
              <Bar
                dataKey="sales"
                name="Revenue"
                fill="#ea580c"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h3 className="text-orange-600 mb-4">Yearly Sales</h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={yearlySalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#ea580c" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h3 className="text-orange-600 mb-4">Top Products</h3>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={80}>
                {pieData.map((_, index) => (
                  <Cell
                    key={`slice-${index}`}
                    fill={pieOrangeShades[index % pieOrangeShades.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
}
