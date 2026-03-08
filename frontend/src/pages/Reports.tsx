import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { getWeeklyReport, getMonthlyReport } from "../api/client";
import { useUser } from "../context/UserContext";
import type { WeeklyReport } from "../types";

const CATEGORY_COLORS: Record<string, string> = {
  transport: "#3b82f6",
  energy: "#f59e0b",
  food: "#22c55e",
  shopping: "#a855f7",
  waste: "#ef4444",
};

export default function Reports() {
  const { currentUser } = useUser();
  const [reportType, setReportType] = useState<"weekly" | "monthly">("weekly");
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [reportType, offset, currentUser]);

  async function loadReport() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data =
        reportType === "weekly"
          ? await getWeeklyReport(currentUser.id, offset)
          : await getMonthlyReport(currentUser.id, offset);
      setReport(data);
    } catch (err) {
      console.error("Failed to load report:", err);
    } finally {
      setLoading(false);
    }
  }

  // Transform daily data to aggregate by date with categories as fields
  function getDailyChartData() {
    if (!report) return [];
    const byDate: Record<string, Record<string, number>> = {};

    for (const entry of report.daily) {
      if (!byDate[entry.date]) {
        byDate[entry.date] = { date: 0 };
      }
      byDate[entry.date]![entry.category] = entry.daily_co2;
    }

    return Object.entries(byDate).map(([date, values]) => ({
      date: date.slice(5),
      ...values,
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-500" />
      </div>
    );
  }

  const chartData = getDailyChartData();
  const categories = [...new Set(report?.daily.map((d) => d.category) ?? [])];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed emission reports</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => { setReportType("weekly"); setOffset(0); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              reportType === "weekly"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => { setReportType("monthly"); setOffset(0); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              reportType === "monthly"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Monthly
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="btn-secondary text-sm"
          >
            Previous
          </button>
          {offset > 0 && (
            <button
              onClick={() => setOffset((o) => Math.max(0, o - 1))}
              className="btn-secondary text-sm"
            >
              Next
            </button>
          )}
          {offset > 0 && (
            <button onClick={() => setOffset(0)} className="btn-secondary text-sm">
              Current
            </button>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {reportType === "weekly" ? "Weekly" : "Monthly"} Total
          </h3>
          <span className="text-3xl font-bold text-eco-600">
            {(report?.totalCo2Kg ?? 0).toFixed(1)} kg
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          CO2 emissions for this {reportType === "weekly" ? "week" : "month"}
          {offset > 0 ? ` (${offset} ${reportType === "weekly" ? "weeks" : "months"} ago)` : ""}
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked Bar Chart - Daily Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daily Breakdown
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `${value.toFixed(2)} kg`}
                />
                <Legend />
                {categories.map((cat) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    stackId="a"
                    fill={CATEGORY_COLORS[cat] ?? "#6b7280"}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No data for this period</p>
          )}
        </div>

        {/* Line Chart - Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daily Trend
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} />
                <Legend />
                {categories.map((cat) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={CATEGORY_COLORS[cat] ?? "#6b7280"}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No data for this period</p>
          )}
        </div>
      </div>

      {/* Category Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Category Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Total CO2 (kg)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Activities</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {(report?.byCategory ?? []).map((cat: any) => (
                <tr key={cat.category} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] ?? "#6b7280" }}
                      />
                      <span className="capitalize text-gray-900 dark:text-white">{cat.category}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-medium">
                    {cat.total_co2.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{cat.count}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                    {report?.totalCo2Kg ? ((cat.total_co2 / report.totalCo2Kg) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
