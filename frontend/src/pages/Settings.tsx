import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { updateUser } from "../api/client";
import { Moon, Sun, Check } from "lucide-react";

const AVATAR_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#06b6d4",
];

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, refreshUsers, selectUser } = useUser();

  const [name, setName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatar_color ?? "#22c55e");
  const [units, setUnits] = useState(currentUser?.units ?? "metric");
  const [gridRegion, setGridRegion] = useState(currentUser?.grid_region ?? "global_avg");
  const [profileSaved, setProfileSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    setError("");
    setProfileSaved(false);

    try {
      const updated = await updateUser(currentUser.id, { name, email, avatarColor });
      await refreshUsers();
      selectUser(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  }

  async function handleSavePrefs(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    setPrefsSaved(false);

    try {
      const updated = await updateUser(currentUser.id, { units, gridRegion });
      await refreshUsers();
      selectUser(updated);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Configure your preferences</p>
      </div>

      {/* Appearance */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => theme !== "light" && toggleTheme()}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
              theme === "light"
                ? "border-eco-500 bg-eco-50 dark:bg-eco-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Sun className={`w-5 h-5 ${theme === "light" ? "text-eco-600" : "text-gray-400"}`} />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Light</p>
              <p className="text-xs text-gray-500">Light background</p>
            </div>
          </button>

          <button
            onClick={() => theme !== "dark" && toggleTheme()}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
              theme === "dark"
                ? "border-eco-500 bg-eco-50 dark:bg-eco-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Moon className={`w-5 h-5 ${theme === "dark" ? "text-eco-400" : "text-gray-400"}`} />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Dark</p>
              <p className="text-xs text-gray-500">Dark background</p>
            </div>
          </button>
        </div>
      </div>

      {/* Profile */}
      <form onSubmit={handleSaveProfile} className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Avatar Color Picker */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Avatar Color
          </label>
          <div className="flex items-center gap-2">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setAvatarColor(color)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                  avatarColor === color ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 scale-110" : "hover:scale-110"
                }`}
                style={{ backgroundColor: color }}
              >
                {avatarColor === color && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        <div className="flex items-center gap-3 mt-4">
          <button type="submit" className="btn-primary">Save Profile</button>
          {profileSaved && (
            <span className="text-sm text-eco-600 dark:text-eco-400 flex items-center gap-1">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
      </form>

      {/* Emission Preferences */}
      <form onSubmit={handleSavePrefs} className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Emission Preferences
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Unit System
            </label>
            <select
              className="select-field max-w-xs"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
            >
              <option value="metric">Metric (kg, km)</option>
              <option value="imperial">Imperial (lbs, miles)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Electricity Grid Region
            </label>
            <select
              className="select-field max-w-xs"
              value={gridRegion}
              onChange={(e) => setGridRegion(e.target.value)}
            >
              <option value="global_avg">Global Average</option>
              <option value="us">United States</option>
              <option value="eu">European Union</option>
              <option value="uk">United Kingdom</option>
              <option value="au">Australia</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button type="submit" className="btn-primary">Save Preferences</button>
          {prefsSaved && (
            <span className="text-sm text-eco-600 dark:text-eco-400 flex items-center gap-1">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
      </form>

      {/* Data Management */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Management
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Download all your activity data as CSV</p>
            </div>
            <button className="btn-secondary text-sm">Export</button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Reset Demo Data</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Reload seed data for testing</p>
            </div>
            <button className="btn-secondary text-sm">Reset</button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          EcoTracker Pro v1.0.0 &mdash; Personal Carbon Footprint Dashboard
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Built with React, TypeScript, Tailwind CSS, Express, and SQLite
        </p>
      </div>
    </div>
  );
}
