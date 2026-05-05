import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function fmtRs(n) {
  const num = Number(n) || 0;
  return (
    "Rs " +
    num.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/**
 * @param {string} ordersApiUrl - e.g. api().getOrders (GET /api/orders, admin)
 */
export async function fetchAdminOrders(ordersApiUrl) {
  const res = await fetch(ordersApiUrl, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Failed to load orders. Please login as admin.");
  }
  return Array.isArray(data.orders) ? data.orders : [];
}

function filterCurrentMonth(orders) {
  const now = new Date();
  return orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

function filterCurrentYear(orders) {
  const y = new Date().getFullYear();
  return orders.filter((o) => new Date(o.createdAt).getFullYear() === y);
}

function sortByDateDesc(orders) {
  return [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

function orderHeaderLines(order) {
  const dt = new Date(order.createdAt);
  const dayName = dt.toLocaleString("en-PK", { weekday: "long" });
  const dateTime = dt.toLocaleString("en-PK");
  const dateOnly = dt.toLocaleDateString("en-PK");
  return { dayName, dateTime, dateOnly };
}

/**
 * Draw one order (customer, shipping, line items, charges). Returns next Y.
 */
function appendOrderDetail(doc, order, startY) {
  let y = startY;
  const pageH = doc.internal.pageSize.height;
  const margin = 14;

  if (y > pageH - 40) {
    doc.addPage();
    y = margin;
  }

  const id = String(order._id || "");
  const { dayName, dateTime, dateOnly } = orderHeaderLines(order);

  doc.setFontSize(11);
  doc.setTextColor(234, 88, 12);
  doc.text(`Order ID: ${id}`, margin, y);
  y += 6;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(`Date & time: ${dateTime}`, margin, y);
  y += 5;
  doc.text(`Date: ${dateOnly}`, margin, y);
  y += 5;
  doc.text(`Day: ${dayName}`, margin, y);
  y += 5;
  doc.text(
    `Status: ${order.status || "—"} | Payment: ${order.paymentMethod || "—"}`,
    margin,
    y,
  );
  y += 5;
  if (order.trackingNumber) {
    doc.text(`Tracking #: ${order.trackingNumber}`, margin, y);
    y += 5;
  }
  y += 3;

  const u = order.user || {};
  doc.setFont("helvetica", "bold");
  doc.text("Customer", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${u.name || "—"}`, margin, y);
  y += 5;
  doc.text(`Email: ${u.email || "—"}`, margin, y);
  y += 5;
  doc.text(`Phone: ${u.phone || "—"}`, margin, y);
  y += 5;
  const profileAddr = (u.address || "").replace(/\s+/g, " ").trim();
  if (profileAddr) {
    const addrLines = doc.splitTextToSize(`Profile address: ${profileAddr}`, 180);
    doc.text(addrLines, margin, y);
    y += addrLines.length * 4.5;
  }
  y += 3;

  const sa = order.shippingAddress || {};
  doc.setFont("helvetica", "bold");
  doc.text("Shipping address", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const shipParts = [
    sa.address,
    sa.city,
    sa.postalCode,
    sa.country || "Pakistan",
  ]
    .filter(Boolean)
    .join(", ");
  const shipLines = doc.splitTextToSize(shipParts || "—", 180);
  doc.text(shipLines, margin, y);
  y += shipLines.length * 4.5 + 4;

  if (y > pageH - 60) {
    doc.addPage();
    y = margin;
  }

  const itemRows = (order.items || []).map((it) => {
    const pname = (it.product && it.product.name) || "(Product removed / N/A)";
    const qty = Number(it.quantity) || 0;
    const unit = Number(it.price) || 0;
    const line = qty * unit;
    return [String(pname), String(qty), fmtRs(unit), fmtRs(line)];
  });

  autoTable(doc, {
    startY: y,
    head: [["Product", "Qty", "Unit price (at order)", "Line total"]],
    body: itemRows.length ? itemRows : [["—", "0", "—", "—"]],
    theme: "grid",
    headStyles: { fillColor: [234, 88, 12], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 72 } },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 6;

  const sub = Number(order.subtotal) || 0;
  const disc = Number(order.discount) || 0;
  const tax = Number(order.tax) || 0;
  const shipFee = Number(order.shippingFee) || 0;
  const total = Number(order.totalPrice) || 0;
  const discPct = order.discountPercentage ?? 0;
  const taxPct = order.taxPercentage ?? 0;

  const charges = [
    ["Subtotal (items)", fmtRs(sub)],
    [`Discount (${discPct}%)`, fmtRs(disc)],
    [`Tax (${taxPct}%)`, fmtRs(tax)],
    ["Shipping / delivery", fmtRs(shipFee)],
    ["Order total", fmtRs(total)],
  ];

  autoTable(doc, {
    startY: y,
    body: charges,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
      1: { halign: "right", cellWidth: 45 },
    },
    margin: { left: 120, right: margin },
  });

  y = doc.lastAutoTable.finalY + 14;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y - 6, doc.internal.pageSize.width - margin, y - 6);

  return y;
}

function coverPage(doc, title, subtitle, stats, orderCount, revenueSum) {
  doc.setFontSize(18);
  doc.setTextColor(234, 88, 12);
  doc.text(title, 14, 24);
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.text(subtitle, 14, 34);
  doc.text(`Generated: ${new Date().toLocaleString("en-PK")}`, 14, 42);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text("Overview", 14, 56);

  const overview = [
    ["Orders in this report", String(orderCount)],
    ["Revenue (sum of order totals)", fmtRs(revenueSum)],
    ["Total orders (system)", String(stats.totalOrders ?? "—")],
    ["Total users", String(stats.totalUsers ?? "—")],
    ["Total products", String(stats.totalProducts ?? "—")],
  ];

  autoTable(doc, {
    startY: 60,
    head: [["Metric", "Value"]],
    body: overview,
    theme: "striped",
    headStyles: { fillColor: [234, 88, 12], textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const after = doc.lastAutoTable.finalY + 10;
  doc.text(
    "Following pages: each order with products, quantities, prices, charges, customer & contact.",
    14,
    after,
  );
  return after + 16;
}

function sumOrderTotals(orders) {
  return orders.reduce((a, o) => a + (Number(o.totalPrice) || 0), 0);
}

async function buildFullPdf(stats, orders, title, subtitle, filename) {
  const sorted = sortByDateDesc(orders);
  const revenueSum = sumOrderTotals(sorted);

  const doc = new jsPDF();
  let y = coverPage(doc, title, subtitle, stats, sorted.length, revenueSum);

  doc.addPage();
  y = 16;
  doc.setFontSize(14);
  doc.setTextColor(234, 88, 12);
  doc.text("Order details", 14, y);
  y += 10;
  doc.setTextColor(0, 0, 0);

  if (sorted.length === 0) {
    doc.setFontSize(10);
    doc.text("No orders in this period.", 14, y);
  } else {
    for (let i = 0; i < sorted.length; i++) {
      y = appendOrderDetail(doc, sorted[i], y);
    }
  }

  doc.save(filename);
}

export async function downloadCurrentMonthReport(stats, ordersApiUrl) {
  const all = await fetchAdminOrders(ordersApiUrl);
  const filtered = filterCurrentMonth(all);
  const now = new Date();
  const subtitle = `Current month: ${now.toLocaleString("en-PK", { month: "long", year: "numeric" })} — full order data`;
  await buildFullPdf(
    stats,
    filtered,
    "Sales report — current month",
    subtitle,
    `orders-detail-current-month-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.pdf`,
  );
}

export async function downloadYearlyReport(stats, ordersApiUrl) {
  const all = await fetchAdminOrders(ordersApiUrl);
  const filtered = filterCurrentYear(all);
  const y = new Date().getFullYear();
  const subtitle = `Calendar year ${y} — full order data`;
  await buildFullPdf(
    stats,
    filtered,
    "Sales report — yearly",
    subtitle,
    `orders-detail-year-${y}.pdf`,
  );
}

export async function downloadEntireReport(stats, ordersApiUrl) {
  const all = await fetchAdminOrders(ordersApiUrl);
  const now = new Date();
  const subtitle = "All orders — full order data";
  await buildFullPdf(
    stats,
    all,
    "Complete sales report — all orders",
    subtitle,
    `orders-detail-all-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.pdf`,
  );
}
