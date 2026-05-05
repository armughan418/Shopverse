import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/footer";
import Carousel from "../components/caroseul";
import api from "../utils/api";
import axios from "axios";
import { toast } from "react-toastify";
import { useLanguage } from "../utils/LanguageContext";
import ProductCard from "../components/ProductCard";
import ProductGridSkeleton from "../components/ProductGridSkeleton";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const fetchHomeSections = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(api().getHomepageProducts);
      if (res.data?.status) {
        setFeatured(res.data.featured || []);
        setBestsellers(res.data.bestsellers || []);
        setNewArrivals(res.data.newArrivals || []);
      }
    } catch {
      toast.error(t("failedToFetchProducts"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchHomeSections();
  }, [fetchHomeSections]);

  const handleAddToCart = useCallback(
    async (productId) => {
      try {
        const isLoggedIn = !!localStorage.getItem("user");

        if (!isLoggedIn) {
          toast.error(t("pleaseLoginToAddToCart"));
          navigate("/login");
          return;
        }

        await axios.post(api().addToCart, { productId, quantity: 1 });
        toast.success(t("addedToCart"));
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        const errorMsg = err.response?.data?.message || t("failedToAddToCart");
        toast.error(errorMsg);

        if (err.response?.status === 401) {
          localStorage.removeItem("user");
          navigate("/login");
        }
      }
    },
    [navigate, t],
  );

  const renderSection = (title, items, emptyKey) => (
    <section className="mb-10 sm:mb-14">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-orange-600">{title}</h2>
        <Link
          to="/products"
          className="text-sm font-semibold text-orange-700 hover:text-orange-900 underline-offset-2 hover:underline"
        >
          {t("browseAllProducts")}
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-6">{t(emptyKey)}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {items.map((product) => (
            <ProductCard
              key={`${title}-${product._id}`}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </section>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50">
        <div className="max-w-6xl mx-auto p-3 sm:p-6 pb-0">
          <Carousel />
        </div>
        <div className="max-w-6xl mx-auto p-3 sm:p-6">
          <div className="h-8 bg-orange-100 rounded w-48 mb-6 animate-pulse" />
          <ProductGridSkeleton count={6} />
          <div className="h-8 bg-orange-100 rounded w-48 mb-6 mt-12 animate-pulse" />
          <ProductGridSkeleton count={8} />
          <div className="h-8 bg-orange-100 rounded w-48 mb-6 mt-12 animate-pulse" />
          <ProductGridSkeleton count={8} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-6xl mx-auto p-3 sm:p-6 pb-0 sm:pb-0">
        <Carousel />
      </div>

      <div className="max-w-6xl mx-auto p-3 sm:p-6">
        {renderSection(t("featuredProducts"), featured, "noProductsFound")}
        {renderSection(t("bestSellers"), bestsellers, "noProductsFound")}
        {renderSection(t("newArrivals"), newArrivals, "noProductsFound")}
      </div>

      <Footer />
    </div>
  );
}
