import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import StarRating from "./StarRating";
import { useLanguage } from "../utils/LanguageContext";
import {
  getLocalizedName,
  getLocalizedDescription,
  getPrimaryMedia,
} from "../utils/productDisplay";

function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const handleClick = () => navigate(`/product/${product._id}`);

  return (
    <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-2 sm:p-4 hover:shadow-xl transition relative flex flex-col">
      <div onClick={handleClick} className="cursor-pointer flex-1">
        <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4 flex items-center justify-center">
          {getPrimaryMedia(product)?.type === "video" ? (
            <video
              src={getPrimaryMedia(product)?.url}
              className="h-32 sm:h-48 object-contain"
              muted
              playsInline
            />
          ) : (
            <img
              src={getPrimaryMedia(product)?.url || product.image}
              alt={getLocalizedName(product, language) || ""}
              className="h-32 sm:h-48 object-contain"
              loading="lazy"
              decoding="async"
            />
          )}
        </div>

        <h3 className="font-semibold text-sm sm:text-lg mt-2 sm:mt-3 text-gray-800 line-clamp-2">
          {getLocalizedName(product, language)}
        </h3>

        <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-2">
          {getLocalizedDescription(product, language)}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={product.rating ?? 0} size={14} />
          <span className="text-gray-600 text-xs sm:text-sm">
            {(product.rating ?? 0).toFixed(1)}
          </span>
        </div>

        {product.oldPrice && product.oldPrice > product.price && (
          <p className="text-gray-400 text-xs sm:text-sm line-through">
            Rs{" "}
            {Number(product.oldPrice).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        )}

        <p className="text-orange-600 font-bold text-base sm:text-xl mt-1">
          Rs{" "}
          {Number(product.price).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onAddToCart(product._id)}
        className="mt-2 sm:mt-4 bg-orange-600 hover:bg-orange-700 text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl shadow-md font-semibold text-sm sm:text-base transition"
      >
        {t("addToCart")}
      </button>
    </div>
  );
}

export default memo(ProductCard);
