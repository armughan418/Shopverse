import React, { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import axios from "axios";
import api from "../utils/api";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";
import { useLanguage } from "../utils/LanguageContext";
import {
  getLocalizedName,
  getLocalizedDescription,
  getPrimaryMedia,
} from "../utils/productDisplay";
import StarRating from "../components/StarRating";

const DEBOUNCE_MS = 400;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get("q") || "";
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const sortParam = searchParams.get("sort") || "";
  const minRatingParam = Math.min(
    5,
    Math.max(0, Number(searchParams.get("minRating")) || 0),
  );

  const [query, setQuery] = useState(qParam);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [products, setProducts] = useState([]);
  const { language, t } = useLanguage();

  const navigate = useNavigate();

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  const fetchResults = useCallback(async () => {
    const trimmed = qParam.trim();
    if (!trimmed) {
      setProducts([]);
      setTotalPages(0);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(
        api().searchProducts(trimmed, page, 12, {
          sort: sortParam,
          minRating: minRatingParam,
        }),
      );
      if (res.data?.status) {
        setProducts(res.data.products || []);
        setTotalPages(res.data.totalPages ?? 0);
      }
    } catch {
      toast.error(t("failedToFetchProducts"));
    } finally {
      setLoading(false);
    }
  }, [qParam, page, sortParam, minRatingParam, t]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const res = await axios.get(api().searchProducts(trimmed, 1, 8));
        if (res.data?.status) setSuggestions(res.data.products || []);
      } catch {
        setSuggestions([]);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    params.set("page", "1");
    setSearchParams(params);
    setSuggestions([]);
  };

  const handleProductClick = (id) => {
    navigate(`/product/${id}`);
  };

  const handleAddToCart = async (id) => {
    try {
      if (!localStorage.getItem("user")) {
        toast.error(t("pleaseLoginToAddToCart"));
        navigate("/login");
        return;
      }
      await axios.post(api().addToCart, { productId: id, quantity: 1 });
      toast.success(t("addedToCart"));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("failedToAddToCart"));
      if (err.response?.status === 401) {
        localStorage.removeItem("user");
        navigate("/login");
      }
    }
  };

  const onPageChange = (next) => {
    const params = new URLSearchParams(searchParams);
    if (qParam) params.set("q", qParam);
    params.set("page", String(next));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-orange-50 p-6 flex flex-col items-center">
      <h2 className="text-3xl font-bold text-orange-700 mb-6">{t("searchProductsTitle")}</h2>

      <div className="w-full max-w-5xl">
        <form onSubmit={handleSearch} className="relative mb-4">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-2xl border border-orange-300 px-5 py-3 pr-12 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            type="submit"
            className="absolute right-3 top-3 text-orange-600"
            aria-label={t("search")}
          >
            <Search size={20} />
          </button>

          {suggestions.length > 0 && query.trim() && (
            <ul className="absolute top-14 w-full bg-white rounded-2xl shadow-xl border border-orange-200 max-h-64 overflow-auto z-50">
              {suggestions.map((s) => (
                <li
                  key={s._id}
                  onClick={() => {
                    const selectedName = getLocalizedName(s, language) || s.name;
                    setQuery(selectedName);
                    const params = new URLSearchParams();
                    params.set("q", selectedName);
                    params.set("page", "1");
                    setSearchParams(params);
                    setSuggestions([]);
                  }}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-orange-50 cursor-pointer"
                >
                  {getPrimaryMedia(s)?.type === "video" ? (
                    <video
                      src={getPrimaryMedia(s)?.url}
                      className="w-10 h-10 rounded object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={getPrimaryMedia(s)?.url || s.image}
                      alt={getLocalizedName(s, language)}
                      className="w-10 h-10 rounded object-cover"
                      loading="lazy"
                    />
                  )}
                  <div>
                    <p className="font-medium text-slate-900">
                      {getLocalizedName(s, language)}
                    </p>
                    <div className="flex items-center gap-1">
                      <StarRating rating={s.rating ?? 0} size={14} />
                      <span className="text-xs text-gray-500">
                        {(s.rating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="flex gap-4 mb-6 items-center bg-white shadow-md border border-orange-200 p-4 rounded-2xl flex-wrap">
          <div className="flex items-center gap-2">
            <label className="font-medium text-sm">{t("sortLabel")}</label>
            <select
              value={sortParam}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (qParam) params.set("q", qParam);
                const v = e.target.value;
                if (v) params.set("sort", v);
                else params.delete("sort");
                params.set("page", "1");
                setSearchParams(params);
              }}
              className="border rounded-lg px-3 py-2 bg-orange-50"
            >
              <option value="">{t("sortRelevance")}</option>
              <option value="price-asc">{t("sortPriceAsc")}</option>
              <option value="price-desc">{t("sortPriceDesc")}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-medium text-sm">{t("minRatingLabel")}</label>
            <select
              value={String(minRatingParam)}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (qParam) params.set("q", qParam);
                const v = e.target.value;
                if (v === "0") params.delete("minRating");
                else params.set("minRating", v);
                params.set("page", "1");
                setSearchParams(params);
              }}
              className="border rounded-lg px-3 py-2 bg-orange-50"
            >
              <option value="0">{t("ratingAny")}</option>
              <option value="1">⭐</option>
              <option value="2">⭐⭐</option>
              <option value="3">⭐⭐⭐</option>
              <option value="4">⭐⭐⭐⭐</option>
              <option value="5">⭐⭐⭐⭐⭐</option>
            </select>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl">
        {loading ? (
          <p className="text-center text-orange-500">{t("loading")}</p>
        ) : !qParam.trim() ? (
          <p className="text-center text-orange-600 mt-6">{t("searchPrompt")}</p>
        ) : products.length === 0 ? (
          <p className="text-center text-orange-500 mt-6">{t("noProductsFound")}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <div
                  key={p._id}
                  className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition relative flex flex-col"
                >
                  <div
                    onClick={() => handleProductClick(p._id)}
                    className="cursor-pointer"
                    role="presentation"
                  >
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center">
                      {getPrimaryMedia(p)?.type === "video" ? (
                        <video
                          src={getPrimaryMedia(p)?.url}
                          className="h-48 object-contain"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={getPrimaryMedia(p)?.url || p.image}
                          alt={getLocalizedName(p, language)}
                          className="h-48 object-contain"
                          loading="lazy"
                        />
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mt-3 text-orange-600">
                      {getLocalizedName(p, language)}
                    </h3>

                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                      {getLocalizedDescription(p, language)}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <StarRating rating={p.rating ?? 0} size={18} />
                      <span className="text-gray-600 text-sm">
                        {(p.rating ?? 0).toFixed(1)}
                      </span>
                    </div>

                    {p.oldPrice && p.oldPrice > p.price && (
                      <p className="text-gray-400 text-sm line-through">
                        Rs{" "}
                        {Number(p.oldPrice).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    )}

                    <p className="text-orange-600 font-bold text-xl mt-1">
                      Rs{" "}
                      {Number(p.price).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(p._id)}
                    className="mt-4 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-xl shadow-md font-semibold transition"
                  >
                    {t("addToCart")}
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-4 mt-8 items-center">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-orange-200 disabled:opacity-40"
                >
                  {t("back")}
                </button>
                <span className="font-medium text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-orange-200 disabled:opacity-40"
                >
                  {t("next")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
