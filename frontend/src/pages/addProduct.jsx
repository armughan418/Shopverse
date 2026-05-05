import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  PlusCircle,
  ArrowUp,
  ArrowDown,
  Trash2,
  RefreshCw,
} from "lucide-react";
import AdminSidebar from "../components/adminSidebar";
import axios from "axios";
import { toast } from "react-toastify";
import api from "../utils/api";

function AddProduct() {
  const [product, setProduct] = useState({
    name: "",
    nameUrdu: "",
    description: "",
    descriptionUrdu: "",
    price: "",
    oldPrice: "",
    category: "",
    inStock: true,
    stockCount: 0,
  });

  const [categories, setCategories] = useState([]);
  const [categoryFetchError, setCategoryFetchError] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false); // <-- ADDED
  const fileInputRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const editId = query.get("id");

  const fetchCategories = useCallback(async () => {
    setCategoryFetchError("");
    try {
      const res = await axios.get(api().getCategories);
      if (res.data?.status) {
        setCategories(res.data.categories || []);
      } else {
        setCategoryFetchError("Failed to load categories");
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
      setCategoryFetchError("Failed to load categories");
    }
  }, []);

  useEffect(() => {
    fetchCategories();

    if (!editId) return;

    const fetchProduct = async () => {
      try {
        const res = await axios.get(api().getSingleProduct(editId));
        const p = res.data?.product;
        if (!p) {
          toast.error("Product not found");
          return;
        }
        setProduct({
          name: p.name || "",
          nameUrdu: p.nameUrdu || "",
          description: p.description || "",
          descriptionUrdu: p.descriptionUrdu || "",
          price: p.price || "",
          oldPrice: p.oldPrice ?? "",
          category: p.category || "",
          inStock: p.inStock ?? true,
          stockCount: p.stockCount ?? 0,
        });
        const normalizedMedia = (
          Array.isArray(p.media) && p.media.length > 0
            ? [...p.media].sort(
                (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
              )
            : p.image
              ? [{ url: p.image, type: "image", sortOrder: 0 }]
              : []
        ).map((item, index) => ({
          id: `${p._id}-existing-${index}`,
          type: item.type || "image",
          url: item.url,
          file: null,
          isExisting: true,
        }));
        setMediaItems(normalizedMedia);
      } catch (err) {
        console.error("Fetch product error:", err.response || err);
        toast.error("Failed to load product for editing");
      }
    };

    fetchProduct();
  }, [editId, fetchCategories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const appendFiles = (files) => {
    const incoming = Array.from(files || []);
    if (incoming.length === 0) return;

    const mapped = incoming.map((file, index) => {
      const isVideo = file.type?.startsWith("video/");
      return {
        id: `new-${Date.now()}-${index}`,
        type: isVideo ? "video" : "image",
        url: URL.createObjectURL(file),
        file,
        isExisting: false,
      };
    });
    setMediaItems((prev) => [...prev, ...mapped]);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      appendFiles(e.dataTransfer.files);
    }
  };

  const removeMedia = (id) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
  };

  const moveMedia = (index, direction) => {
    setMediaItems((prev) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const clone = [...prev];
      [clone[index], clone[target]] = [clone[target], clone[index]];
      return clone;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // <-- ADDED

    if (mediaItems.length === 0) {
      setLoading(false);
      return toast.error("Please upload at least one image or video");
    }

    try {
      const fd = new FormData();
      fd.append("name", product.name);
      fd.append("nameUrdu", product.nameUrdu);
      fd.append("description", product.description);
      fd.append("descriptionUrdu", product.descriptionUrdu);
      fd.append("price", product.price);
      fd.append("oldPrice", product.oldPrice);
      fd.append("category", product.category);
      fd.append("stockCount", product.stockCount);
      fd.append("inStock", product.inStock);

      const existingMedia = mediaItems
        .filter((item) => item.isExisting)
        .map((item) => ({ url: item.url, type: item.type }));
      fd.append("existingMedia", JSON.stringify(existingMedia));

      mediaItems
        .filter((item) => !item.isExisting && item.file)
        .forEach((item) => fd.append("media", item.file));

      let productRes;
      if (editId) {
        productRes = await axios.put(api().updateProduct(editId), fd);
      } else {
        productRes = await axios.post(api().addProduct, fd);
      }

      if (productRes.data.status) {
        toast.success(
          editId
            ? "Product updated successfully!"
            : "Product added successfully!",
        );
        setProduct({
          name: "",
          nameUrdu: "",
          description: "",
          descriptionUrdu: "",
          price: "",
          oldPrice: "",
          category: "",
          inStock: true,
          stockCount: 0,
        });
        setMediaItems([]);
        if (editId) navigate("/manage-products");
      } else {
        toast.error(productRes.data.message || "Failed to add product");
      }
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(err.response?.data?.message || "Failed to add product");
    }

    setLoading(false); // <-- ADDED
  };

  return (
    <AdminSidebar>
      <div className="p-8 bg-orange-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-orange-600 mb-6 flex items-center gap-3">
            <PlusCircle size={28} />{" "}
            {editId ? "Edit Product" : "Add New Product"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-lg rounded-3xl p-8 space-y-6 border-l-4 border-orange-500"
          >
            {/* Media Upload */}
            <div
              className="border-2 border-dashed border-orange-400 rounded-xl p-6 py-10 text-center cursor-pointer hover:border-orange-600 transition"
              onClick={() => fileInputRef.current.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {mediaItems.length === 0 ? (
                <p className="text-orange-500 font-medium">
                  Drag & Drop Images/Videos here or Click to Upload
                </p>
              ) : (
                <p className="text-orange-500 font-medium">
                  {mediaItems.length} media file(s) selected
                </p>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => appendFiles(e.target.files)}
              />
            </div>

            {mediaItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">
                  Media Order (first item will appear first for customer)
                </h4>
                {mediaItems.map((media, index) => (
                  <div
                    key={media.id}
                    className="border border-orange-200 rounded-xl p-3 flex items-center gap-3 bg-orange-50/40"
                  >
                    <span className="text-xs font-semibold text-orange-600 w-6">
                      {index + 1}
                    </span>
                    <div className="w-20 h-20 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                      {media.type === "video" ? (
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={media.url}
                          alt={`media-${index}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        {media.type === "video" ? "Video" : "Image"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {media.isExisting ? "Existing media" : "New upload"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="p-2 rounded-lg border border-gray-300 hover:bg-white"
                        onClick={() => moveMedia(index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-lg border border-gray-300 hover:bg-white"
                        onClick={() => moveMedia(index, "down")}
                        disabled={index === mediaItems.length - 1}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => removeMedia(media.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Product Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 transition shadow-sm"
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Product Name (Urdu)
              </label>
              <input
                type="text"
                name="nameUrdu"
                value={product.nameUrdu}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 transition shadow-sm"
                placeholder="اردو میں پروڈکٹ کا نام درج کریں"
                dir="rtl"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 transition shadow-sm"
                placeholder="Enter product description"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Description (Urdu)
              </label>
              <textarea
                name="descriptionUrdu"
                value={product.descriptionUrdu}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 transition shadow-sm"
                placeholder="اردو میں پروڈکٹ کی تفصیل درج کریں"
                rows={4}
                dir="rtl"
              />
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={product.price}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 transition shadow-sm"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Stock Count
                </label>
                <input
                  type="number"
                  name="stockCount"
                  value={product.stockCount}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 transition shadow-sm"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Old Price ($)
                </label>
                <input
                  type="number"
                  name="oldPrice"
                  value={product.oldPrice}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 transition shadow-sm"
                  placeholder="Optional previous price"
                />
              </div>
            </div>

            {/* Category & In Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="block text-gray-700 font-medium">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => fetchCategories()}
                    className="text-sm flex items-center gap-1 text-orange-600 hover:text-orange-800 font-medium"
                  >
                    <RefreshCw size={14} />
                    Refresh list
                  </button>
                </div>
                <select
                  name="category"
                  value={product.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition shadow-sm"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && !categoryFetchError && (
                  <p className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    No categories found. First add categories on the{" "}
                    <Link
                      to="/admin-categories"
                      className="font-semibold text-orange-700 underline"
                    >
                      Categories
                    </Link>{" "}
                    page, then click <strong>Refresh list</strong> here.
                  </p>
                )}
                {categoryFetchError && (
                  <p className="mt-2 text-sm text-red-500">
                    {categoryFetchError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <input
                  type="checkbox"
                  name="inStock"
                  checked={product.inStock}
                  onChange={handleChange}
                  className="h-5 w-5 text-orange-600 accent-orange-500"
                />
                <label className="text-gray-700 font-medium">In Stock</label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-3 bg-orange-600 text-white p-4 rounded-2xl font-semibold transition shadow-md 
              ${
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-orange-700"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>{editId ? "Update Product" : "Add Product"}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </AdminSidebar>
  );
}

export default AddProduct;
