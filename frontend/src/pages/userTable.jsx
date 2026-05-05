import { useEffect, useState } from "react";
import AdminLayout from "../components/adminSidebar";
import { toast } from "react-toastify";
import { Pencil, Trash2, Save, X } from "lucide-react";
import api from "../utils/api";

function UserTable() {
  const [users, setUsers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [tempData, setTempData] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(api().getUsers, {
        credentials: "include",
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) throw new Error(data.message || "Failed to fetch users");
      setUsers(data.users);
    } catch (err) {
      setLoading(false);
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setEditId(user._id);
    setTempData({ name: user.name, role: user.role });
  };
  const handleCancel = () => {
    setEditId(null);
    setTempData({});
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await fetch(api().updateUser(id), {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tempData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      toast.success("User updated successfully");
      fetchUsers();
      setEditId(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(api().deleteUser(id), {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 mt-6">
        <div className="max-w-screen-xl mx-auto bg-white shadow-xl rounded-2xl p-6 border border-orange-200">
          <h3 className="text-3xl font-extrabold text-orange-700 mb-6">
            Users Management
          </h3>
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Sr #
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Role
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user, idx) => (
                    <tr
                      key={user._id}
                      className="hover:bg-orange-50 transition-colors duration-200"
                    >
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2">
                        {editId === user._id ? (
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={tempData.name}
                            onChange={(e) =>
                              setTempData({ ...tempData, name: e.target.value })
                            }
                          />
                        ) : (
                          user.name
                        )}
                      </td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">
                        {editId === user._id ? (
                          <select
                            className="border rounded px-2 py-1 w-full"
                            value={tempData.role}
                            onChange={(e) =>
                              setTempData({ ...tempData, role: e.target.value })
                            }
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="capitalize">{user.role}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        {editId === user._id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(user._id)}
                              className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded"
                            >
                              <Save size={16} /> Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="flex items-center gap-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
                            >
                              <X size={16} /> Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded"
                            >
                              <Pencil size={16} /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
export default UserTable;
