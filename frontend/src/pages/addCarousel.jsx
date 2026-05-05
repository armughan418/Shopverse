import React, { useState } from "react";
import AdminLayout from "../components/adminSidebar";
import { toast } from "react-toastify";
import api from "../utils/api";
import axios from "axios";

function AddCarousel() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!file) return toast.error("Please select an image to add");
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("image", file);
      fd.append("title", title);
      fd.append("alt", alt);
      fd.append("order", order);

      const res = await axios.post(api().addCarouselImage, fd);
      if (res.data.success) {
        toast.success("Image added successfully");
        setFile(null);
        setTitle("");
        setAlt("");
        setOrder(0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 mt-6 max-w-xl mx-auto bg-white shadow-xl rounded-2xl border border-orange-100">
        <h3 className="text-3xl font-extrabold text-orange-600 mb-6 text-center">
          Add Carousel Image
        </h3>
        <div className="flex flex-col gap-4">
          <label className="font-medium text-gray-700">Select Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="border border-gray-300 rounded p-2"
          />

          <label className="font-medium text-gray-700">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-gray-300 rounded p-2"
          />

          <label className="font-medium text-gray-700">Alt Text</label>
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className="border border-gray-300 rounded p-2"
          />

          <label className="font-medium text-gray-700">Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="border border-gray-300 rounded p-2"
          />

          <button
            onClick={handleAdd}
            disabled={loading}
            className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-xl transition-all duration-200"
          >
            {loading ? "Adding..." : "Add Image"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AddCarousel;
