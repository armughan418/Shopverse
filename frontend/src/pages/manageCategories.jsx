import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import AdminLayout from "../components/adminSidebar";
import axios from "axios";
import { toast } from "react-toastify";
import api from "../utils/api";

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(api().getCategories);
      if (res.data?.status) {
        setCategories(res.data.categories || []);
      } else {
        toast.error(res.data?.message || "Failed to load categories");
      }
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.warning("Category name is required");
      return;
    }
    try {
      setSaving(true);
      const res = await axios.post(api().addCategory, { name: trimmed });
      if (res.data?.status) {
        toast.success(res.data.message || "Category added");
        setName("");
        await fetchCategories();
      } else {
        toast.error(res.data?.message || "Failed to add category");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Delete category "${label}"?`)) return;
    try {
      const res = await axios.delete(api().deleteCategory(id));
      if (res.data?.status) {
        toast.success(res.data.message || "Deleted");
        setCategories((prev) => prev.filter((c) => c._id !== id));
      } else {
        toast.error(res.data?.message || "Failed to delete");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 bg-orange-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Add categories here first — they will appear in{" "}
                <Link
                  to="/add-products"
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Add Product
                </Link>{" "}
                when creating or editing a product.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchCategories()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-200 bg-white text-orange-700 hover:bg-orange-50 disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <form
            onSubmit={handleAdd}
            className="bg-white rounded-2xl shadow-xl p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-orange-600 mb-4">
              Add new category
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter new Category name"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-60"
              >
                <Plus size={20} />
                {saving ? "Saving…" : "Add category"}
              </button>
            </div>
          </form>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-orange-100 bg-orange-50">
              <h2 className="text-xl font-semibold text-orange-600">
                All categories ({categories.length})
              </h2>
            </div>

            {loading ? (
              <p className="p-8 text-center text-gray-500">Loading…</p>
            ) : categories.length === 0 ? (
              <p className="p-8 text-center text-gray-500">
                No categories yet. Add one above to use it on products.
              </p>
            ) : (
              <ul className="divide-y divide-orange-50">
                {categories.map((cat) => (
                  <li
                    key={cat._id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-orange-50/50"
                  >
                    <span className="font-medium text-gray-800">
                      {cat.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat._id, cat.name)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                      title="Delete category"
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
