import React from "react";

export default function ProductGridSkeleton({ count = 8, columns = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" }) {
  return (
    <div className={`grid ${columns} gap-3 sm:gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow p-4 animate-pulse flex flex-col gap-3"
        >
          <div className="bg-gray-200 h-40 sm:h-48 rounded-xl" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-10 bg-gray-200 rounded-xl mt-auto" />
        </div>
      ))}
    </div>
  );
}
