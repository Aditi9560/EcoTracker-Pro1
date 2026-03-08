import { useState } from "react";
import { Leaf, Plus, Trash2, Users } from "lucide-react";
import { useUser } from "../context/UserContext";
import { createUser, deleteUser } from "../api/client";

export default function UserSelect() {
  const { users, selectUser, refreshUsers } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const user = await createUser({ name, email });
      await refreshUsers();
      selectUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  }

  async function handleDelete(userId: string) {
    try {
      await deleteUser(userId);
      await refreshUsers();
      setConfirmDelete(null);
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  }

  function getInitials(userName: string) {
    return userName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-eco-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">EcoTracker Pro</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Who's tracking today?</p>
        </div>

        {/* User Cards */}
        {users.length > 0 && (
          <div className="space-y-3 mb-6">
            {users.map((user) => (
              <div key={user.id} className="relative group">
                <button
                  onClick={() => selectUser(user)}
                  className="w-full card flex items-center gap-4 hover:shadow-md hover:border-eco-300 dark:hover:border-eco-700 transition-all text-left"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: user.avatar_color }}
                  >
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <span className="text-sm text-eco-600 dark:text-eco-400 font-medium shrink-0">
                    Select
                  </span>
                </button>

                {/* Delete button */}
                {confirmDelete === user.id ? (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-10">
                    <span className="text-xs text-red-500 whitespace-nowrap">Delete all data?</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Yes
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(user.id); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 transition-all"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No users message */}
        {users.length === 0 && !showForm && (
          <div className="card text-center py-8 mb-6">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No users yet. Create one to get started!</p>
          </div>
        )}

        {/* Create User Form */}
        {showForm ? (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Family Member</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Mom, Dad, Sarah"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="e.g., sarah@family.local"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Create & Start</button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(""); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full card flex items-center justify-center gap-2 py-4 text-eco-600 dark:text-eco-400 hover:bg-eco-50 dark:hover:bg-eco-900/20 hover:border-eco-300 dark:hover:border-eco-700 transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Family Member
          </button>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Each family member has their own activities, goals, and reports.
        </p>
      </div>
    </div>
  );
}
