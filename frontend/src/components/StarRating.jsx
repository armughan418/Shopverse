import React from "react";

function StarRating({ rating = 0, size = 16 }) {
  const clamped = Math.max(0, Math.min(5, Number(rating) || 0));
  const percent = (clamped / 5) * 100;
  const px = typeof size === "number" ? `${size}px` : size;

  const stars = Array.from({ length: 5 }).map((_, i) => (
    <span key={i} style={{ fontSize: px, lineHeight: 1 }}>
      ★
    </span>
  ));

  return (
    <span
      style={{ position: "relative", display: "inline-block", lineHeight: 0 }}
    >
      <span style={{ color: "#e5e7eb", display: "inline-block" }}>{stars}</span>
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          overflow: "hidden",
          width: `${percent}%`,
          whiteSpace: "nowrap",
          color: "#f59e0b",
          display: "inline-block",
        }}
      >
        {stars}
      </span>
    </span>
  );
}
export default StarRating;
