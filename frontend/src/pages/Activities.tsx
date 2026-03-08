import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getActivities, createActivity, deleteActivity, getEmissionFactors } from "../api/client";
import { useUser } from "../context/UserContext";
import type { Activity } from "../types";

const CATEGORY_COLORS: Record<string, string> = {
  transport: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  energy: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  food: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  shopping: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  waste: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function Activities() {
  const { currentUser } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [factors, setFactors] = useState<Record<string, Record<string, { factor: number; unit: string }>>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");

  // Form state
  const [category, setCategory] = useState("transport");
  const [type, setType] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]!);

  useEffect(() => {
    loadData();
  }, [filterCategory, currentUser]);

  async function loadData() {
    if (!currentUser) return;
    try {
      const [a, f] = await Promise.all([
        getActivities(currentUser.id, { category: filterCategory || undefined }),
        getEmissionFactors(),
      ]);
      setActivities(a);
      setFactors(f);
    } catch (err) {
      console.error("Failed to load activities:", err);
    } finally {
      setLoading(false);
    }
  }

  // Set default type when category changes
  useEffect(() => {
    const types = Object.keys(factors[category] ?? {});
    setType(types[0] ?? "");
  }, [category, factors]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const typeInfo = factors[category]?.[type];
    if (!typeInfo) return;

    if (!currentUser) return;
    try {
      await createActivity(currentUser.id, {
        category,
        type,
        description,
        value: parseFloat(value),
        unit: typeInfo.unit,
        date,
      });
      setShowForm(false);
      setValue("");
      setDescription("");
      loadData();
    } catch (err) {
      console.error("Failed to create activity:", err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteActivity(id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activities</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Log and track your daily activities</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Log Activity
        </button>
      </div>

      {/* Add Activity Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Activity</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-field"
              >
                {Object.keys(factors).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="select-field">
                {Object.entries(factors[category] ?? {}).map(([key, info]) => (
                  <option key={key} value={key}>
                    {key.replace(/_/g, " ")} ({info.factor} kg CO2/{info.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Value ({factors[category]?.[type]?.unit ?? "unit"})
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                placeholder="e.g., Commute to work"
              />
            </div>

            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary">
                Save Activity
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
        {["", "transport", "energy", "food", "shopping", "waste"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterCategory === cat
                ? "bg-eco-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {cat === "" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No activities logged yet. Start by adding one!</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="card flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[activity.category] ?? ""}`}
                >
                  {activity.category}
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {activity.type.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.value} {activity.unit} &middot; {activity.date}
                    {activity.description ? ` &middot; ${activity.description}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(activity.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
