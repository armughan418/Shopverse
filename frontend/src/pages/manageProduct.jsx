import React, { useEffect, useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import AdminLayout from "../components/adminSidebar";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import axios from "axios";
import { toast } from "react-toastify";

function ManageProducts() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const res = await axios.get(api().getProductsPaged(1, 500));
      setProducts(res.data?.products || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch products");
    }
  };

  const getPrimaryMedia = (product) =>
    Array.isArray(product?.media) && product.media.length > 0
      ? [...product.media].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0]
      : product?.image
        ? { url: product.image, type: "image" }
        : null;

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      const res = await axios.delete(api().deleteProduct(id));

      if (res.data.status) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        toast.error(res.data.message || "Failed to delete product");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting product");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <AdminLayout>
      <div className="p-8 bg-orange-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Manage Products</h2>
          <button
            onClick={() => navigate("/add-products")}
            className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2 rounded-xl"
          >
            <Plus size={20} /> Add Product
          </button>
        </div>

        <table className="w-full bg-white shadow rounded-xl overflow-hidden">
          <thead className="bg-orange-100">
            <tr>
              <th className="p-4 text-left">Image</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Price</th>
              <th className="p-4 text-left">Stock</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products?.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-4">
                  {getPrimaryMedia(p)?.type === "video" ? (
                    <video
                      src={getPrimaryMedia(p)?.url}
                      className="w-16 h-16 rounded-lg object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={getPrimaryMedia(p)?.url || p.image}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                </td>
                <td className="p-4">{p.name}</td>
                <td className="p-4">{p.category}</td>
                <td className="p-4">Rs {p.price}</td>
                <td className="p-4">{p.stockCount}</td>
                <td className="p-4 text-center">
                  <div className="flex gap-3 justify-center">
                    {/* EDIT */}
                    <button
                      onClick={() => navigate(`/add-products?id=${p._id}`)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
                    >
                      <Edit2 size={18} /> Edit
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 size={18} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  No products available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default ManageProducts;
