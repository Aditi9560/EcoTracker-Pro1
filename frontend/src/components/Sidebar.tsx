import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  Target,
  BarChart3,
  Database,
  Settings,
  Leaf,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/activities", icon: Activity, label: "Activities" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/data-sources", icon: Database, label: "Data Sources" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-eco-500 rounded-xl flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">EcoTracker</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pro Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-eco-50 dark:bg-eco-900/30 text-eco-700 dark:text-eco-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-eco-50 dark:bg-eco-900/20 rounded-lg p-4">
          <p className="text-xs font-medium text-eco-800 dark:text-eco-300">Eco Tip</p>
          <p className="text-xs text-eco-600 dark:text-eco-400 mt-1">
            Reducing meat consumption by one day per week can save ~200 kg CO2/year.
          </p>
        </div>
      </div>
    </aside>
  );
}
