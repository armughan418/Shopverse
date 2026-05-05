import React, { useEffect, useState, useCallback } from "react";
import AdminLayout from "../components/adminSidebar";
import { Star, Eye, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/api"; // Make sure your api.js has reviews endpoint
import axios from "axios";

function RatingReviews() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);

  // Fetch all products with reviews
  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(api().getProductsPaged(1, 500));

      const productsWithReviews = await Promise.all(
        (res.data?.products || []).map(async (product) => {
          // Fetch reviews for each product
          const reviewRes = await axios.get(api().getReviews(product._id));
          const reviewsData = reviewRes.data.reviews || [];
          const avgRating =
            reviewsData.reduce((sum, r) => sum + r.rating, 0) /
            (reviewsData.length || 1);
          return {
            ...product,
            reviewsCount: reviewsData.length,
            avgRating: reviewsData.length ? avgRating : 0,
            reviews: reviewsData,
          };
        })
      );

      setProducts(productsWithReviews);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fetch products");
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Delete all reviews for a product
  const handleDeleteReviews = async (productId) => {
    if (!window.confirm("Are you sure you want to delete all reviews?")) return;

    try {
      // Fetch reviews for the product
      const reviewRes = await axios.get(api().getReviews(productId));
      const reviews = reviewRes.data.reviews || [];

      // Delete each review
      for (let review of reviews) {
        await axios.delete(api().deleteReview(review._id));
      }

      toast.success("All reviews deleted successfully");
      fetchProducts(); // Refresh products
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete reviews");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 mt-6">
        <div className="max-w-screen-xl mx-auto bg-white shadow-lg rounded-2xl p-6 border border-orange-200">
          <h3 className="text-3xl font-extrabold text-orange-700 mb-6">
            Product Ratings & Reviews
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                    Reviews
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition">
                    {/* Product */}
                    <td className="px-6 py-4 flex items-center gap-4">
                      <img
                        src={product.image || "https://via.placeholder.com/100"}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                      <span className="font-semibold text-gray-900">
                        {product.name}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-orange-600 font-semibold">
                        <Star
                          size={18}
                          className="fill-orange-500 text-orange-500"
                        />
                        {product.avgRating ? product.avgRating.toFixed(1) : "-"}
                      </div>
                    </td>

                    {/* Reviews */}
                    <td className="px-6 py-4">
                      <span className="text-gray-800 font-medium">
                        {product.reviewsCount || 0} reviews
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        {/* View Reviews */}
                        <button
                          onClick={() => {
                            setModalProduct(product);
                            setShowModal(true);
                          }}
                          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
                        >
                          <Eye size={16} /> View
                        </button>

                        {/* Delete Reviews */}
                        <button
                          onClick={() => handleDeleteReviews(product._id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">
                      No products available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Reviews Modal */}
      {showModal && modalProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold">
                Reviews for {modalProduct.name}
              </h4>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>

            {modalProduct.reviews && modalProduct.reviews.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-auto">
                {modalProduct.reviews.map((r) => (
                  <div key={r._id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-orange-600">
                          {r.user?.name
                            ? r.user.name.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {r.user?.name || "User"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {r.user?.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-yellow-500 font-semibold">
                        {"★".repeat(r.rating)}
                      </div>
                    </div>
                    <div className="text-gray-700">{r.comment || r.review}</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reviews for this product.</p>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
export default RatingReviews;
