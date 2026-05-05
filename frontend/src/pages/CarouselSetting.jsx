import React, { useEffect, useState } from "react";
import AdminLayout from "../components/adminSidebar";
import { toast } from "react-toastify";
import api from "../utils/api";
import axios from "axios";
import { Trash2, Edit2, Upload } from "lucide-react";

function CarouselSetting() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchImages = async () => {
    try {
      const res = await axios.get(api().getCarousel);
      setImages(res.data.images || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load images");
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUpdate = async (id, file, updates = {}) => {
    try {
      setLoading(true);
      const fd = new FormData();
      if (file) fd.append("image", file);
      if (updates.title !== undefined) fd.append("title", updates.title);
      if (updates.alt !== undefined) fd.append("alt", updates.alt);
      if (updates.order !== undefined) fd.append("order", updates.order);

      const res = await axios.put(api().updateCarouselImage(id), fd);
      if (res.data.success) {
        toast.success("Image updated Sucessfully!");
        fetchImages();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update image");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      setLoading(true);
      const res = await axios.delete(api().deleteCarouselImage(id));
      if (res.data.success) {
        toast.success("Deleted successfully");
        fetchImages();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 mt-6 max-w-6xl mx-auto">
        <h3 className="text-3xl font-extrabold text-orange-600 mb-8 text-center">
          Manage Carousel Images
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {images.map((img) => (
            <div
              key={img._id}
              className="bg-white border border-gray-200 rounded-2xl shadow hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              <div className="relative">
                <img
                  src={img.image}
                  alt={img.alt || ""}
                  className="w-full h-48 object-cover rounded-t-2xl"
                />
                <label className="absolute top-2 right-2 bg-white p-2 rounded-full cursor-pointer shadow hover:bg-gray-100">
                  <Upload size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      const title = document.getElementById(
                        `title-${img._id}`
                      ).value;
                      const alt = document.getElementById(
                        `alt-${img._id}`
                      ).value;
                      const order = document.getElementById(
                        `order-${img._id}`
                      ).value;
                      handleUpdate(img._id, file, { title, alt, order });
                    }}
                  />
                </label>
              </div>

              <div className="p-4 flex flex-col gap-3">
                <input
                  defaultValue={img.title}
                  placeholder="Title"
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  id={`title-${img._id}`}
                />
                <input
                  defaultValue={img.alt}
                  placeholder="Alt Text"
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  id={`alt-${img._id}`}
                />
                <input
                  defaultValue={img.order}
                  type="number"
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  id={`order-${img._id}`}
                />

                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => handleDelete(img._id)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-all duration-200"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                  <button
                    onClick={() => {
                      const title = document.getElementById(
                        `title-${img._id}`
                      ).value;
                      const alt = document.getElementById(
                        `alt-${img._id}`
                      ).value;
                      const order = document.getElementById(
                        `order-${img._id}`
                      ).value;
                      handleUpdate(img._id, null, { title, alt, order });
                    }}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl transition-all duration-200"
                  >
                    <Edit2 size={16} /> Save
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export default CarouselSetting;
