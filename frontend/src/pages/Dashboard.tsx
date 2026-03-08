import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { TrendingDown, TrendingUp, Leaf, Zap, Car, UtensilsCrossed } from "lucide-react";
import { getEmissionStats, getEmissionTrend, getEmissionsByCategory, getEcoTips } from "../api/client";
import { useUser } from "../context/UserContext";
import type { EmissionStats, EmissionTrend, EmissionByCategory, EcoTip } from "../types";

const CATEGORY_COLORS: Record<string, string> = {
  transport: "#3b82f6",
  energy: "#f59e0b",
  food: "#22c55e",
  shopping: "#a855f7",
  waste: "#ef4444",
};

const CATEGORY_ICONS: Record<string, typeof Leaf> = {
  transport: Car,
  energy: Zap,
  food: UtensilsCrossed,
};

export default function Dashboard() {
  const { currentUser } = useUser();
  const [stats, setStats] = useState<EmissionStats | null>(null);
  const [trend, setTrend] = useState<EmissionTrend[]>([]);
  const [byCategory, setByCategory] = useState<EmissionByCategory[]>([]);
  const [tips, setTips] = useState<EcoTip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    async function loadData() {
      try {
        const [s, t, c, ti] = await Promise.all([
          getEmissionStats(currentUser!.id),
          getEmissionTrend(currentUser!.id, 30),
          getEmissionsByCategory(currentUser!.id),
          getEcoTips(),
        ]);
        setStats(s);
        setTrend(t);
        setByCategory(c);
        setTips(ti);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-500" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Emissions",
      value: `${stats?.total_co2_kg.toFixed(1) ?? "0"} kg`,
      sub: "All time",
      icon: Leaf,
      color: "text-eco-600",
      bg: "bg-eco-50 dark:bg-eco-900/20",
    },
    {
      label: "This Week",
      value: `${stats?.weekly_co2_kg.toFixed(1) ?? "0"} kg`,
      sub: "CO2 emitted",
      icon: TrendingDown,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "This Month",
      value: `${stats?.monthly_co2_kg.toFixed(1) ?? "0"} kg`,
      sub: "CO2 emitted",
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "Activities",
      value: stats?.total_activities ?? 0,
      sub: `Avg ${stats?.avg_per_activity.toFixed(2) ?? "0"} kg each`,
      icon: Zap,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your carbon footprint overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{card.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.sub}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            30-Day Emission Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value.toFixed(2)} kg CO2`, "Emissions"]}
              />
              <Area
                type="monotone"
                dataKey="total_co2_kg"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorCo2)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            By Category
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={byCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="total_co2_kg"
                nameKey="category"
                paddingAngle={4}
              >
                {byCategory.map((entry) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? "#6b7280"} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {byCategory.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.category] ?? "#6b7280" }}
                  />
                  <span className="capitalize text-gray-600 dark:text-gray-400">
                    {cat.category}
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {cat.total_co2_kg.toFixed(1)} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Category Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} />
              <Legend />
              <Bar dataKey="total_co2_kg" name="Total CO2 (kg)" radius={[4, 4, 0, 0]}>
                {byCategory.map((entry) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Eco Tips */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Eco Tips
          </h3>
          <div className="space-y-3">
            {tips.map((tip, i) => {
              const Icon = CATEGORY_ICONS[tip.category] ?? Leaf;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div
                    className="p-2 rounded-lg shrink-0"
                    style={{ backgroundColor: `${CATEGORY_COLORS[tip.category] ?? "#22c55e"}20` }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: CATEGORY_COLORS[tip.category] ?? "#22c55e" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{tip.tip}</p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">{tip.category}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
