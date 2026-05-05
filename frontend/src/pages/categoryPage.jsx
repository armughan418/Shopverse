import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import api from "../utils/api";
import { useLanguage } from "../utils/LanguageContext";
import ProductCard from "../components/ProductCard";
import ProductGridSkeleton from "../components/ProductGridSkeleton";
import ProductPagination from "../components/ProductPagination";
import Footer from "../components/footer";

function CategoryPage() {
  const { categoryName } = useParams();
  const decoded = categoryName ? decodeURIComponent(categoryName) : "";
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);

  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const fetchPage = useCallback(async () => {
    if (!decoded) return;
    try {
      setLoading(true);
      const res = await axios.get(
        api().getProductsByCategory(decoded, page, 12),
      );
      if (res.data?.status) {
        setProducts(res.data.products || []);
        setTotalPages(res.data.totalPages ?? 0);
      } else {
        toast.error(res.data?.message || t("failedToFetchProducts"));
      }
    } catch {
      toast.error(t("failedToFetchProducts"));
    } finally {
      setLoading(false);
    }
  }, [decoded, page, t]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleAddToCart = useCallback(
    async (productId) => {
      try {
        if (!localStorage.getItem("user")) {
          toast.error(t("pleaseLoginToAddToCart"));
          navigate("/login");
          return;
        }
        await axios.post(api().addToCart, { productId, quantity: 1 });
        toast.success(t("addedToCart"));
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        toast.error(err.response?.data?.message || t("failedToAddToCart"));
        if (err.response?.status === 401) {
          localStorage.removeItem("user");
          navigate("/login");
        }
      }
    },
    [navigate, t],
  );

  const onPageChange = (next) => {
    setSearchParams(next === 1 ? {} : { page: String(next) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!decoded) {
    return (
      <div className="min-h-screen bg-orange-50 p-8 text-center text-gray-600">
        {t("noProductsFound")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 flex-1 w-full">
        <h1 className="text-3xl font-bold text-orange-700 mb-2 capitalize">
          {decoded}
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          {t("categoryBrowseHint")}
        </p>

        {loading ? (
          <ProductGridSkeleton count={12} />
        ) : products.length === 0 ? (
          <p className="text-center text-gray-600 py-12">
            {t("noProductsFound")}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
            <ProductPagination
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
              disabled={loading}
              labels={{ prev: t("back"), next: t("next") }}
            />
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
export default CategoryPage;
