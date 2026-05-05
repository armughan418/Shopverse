import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../components/adminSidebar";
import api from "../utils/api";

export default function AdditionalCharges() {
  const [form, setForm] = useState({
    deliveryCost: 0,
    discountPercentage: 0,
    taxPercentage: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCharges = async () => {
    try {
      setLoading(true);
      const res = await axios.get(api().getOrderCharges);

      if (res.data?.status && res.data?.settings) {
        setForm({
          deliveryCost: res.data.settings.deliveryCost ?? 0,
          discountPercentage: res.data.settings.discountPercentage ?? 0,
          taxPercentage: res.data.settings.taxPercentage ?? 10,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharges();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        deliveryCost: Number(form.deliveryCost),
        discountPercentage: Number(form.discountPercentage),
        taxPercentage: Number(form.taxPercentage),
      };

      const res = await axios.put(api().updateOrderCharges, payload);

      if (res.data?.status) {
        toast.success(res.data.message || "Settings saved");
        setForm({
          deliveryCost: res.data.settings.deliveryCost,
          discountPercentage: res.data.settings.discountPercentage,
          taxPercentage: res.data.settings.taxPercentage,
        });
      } else {
        toast.error(res.data?.message || "Failed to save settings");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-gray-500">Loading settings...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-orange-600 mb-6">
          Additional Charges
        </h1>

        <div className="max-w-2xl bg-white rounded-2xl shadow-xl p-6 border border-orange-100">
          <p className="text-sm text-gray-600 mb-6">
            All these values will be automatically applied to new customer
            orders.
          </p>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Cost (PKR)
              </label>
              <input
                type="number"
                name="deliveryCost"
                min="0"
                step="1"
                value={form.deliveryCost}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount Percentage (%)
              </label>
              <input
                type="number"
                name="discountPercentage"
                min="0"
                max="100"
                step="0.01"
                value={form.discountPercentage}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tax Percentage (%)
              </label>
              <input
                type="number"
                name="taxPercentage"
                min="0"
                max="100"
                step="0.01"
                value={form.taxPercentage}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-700 transition disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save Charges"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
