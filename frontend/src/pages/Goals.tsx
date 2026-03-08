import { useEffect, useState } from "react";
import { Plus, Target, CheckCircle, XCircle } from "lucide-react";
import { getGoals, createGoal, updateGoal, deleteGoal } from "../api/client";
import { useUser } from "../context/UserContext";
import type { Goal } from "../types";

export default function Goals() {
  const { currentUser } = useUser();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetKg, setTargetKg] = useState("");
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    loadGoals();
  }, [currentUser]);

  async function loadGoals() {
    if (!currentUser) return;
    try {
      const data = await getGoals(currentUser.id);
      setGoals(data);
    } catch (err) {
      console.error("Failed to load goals:", err);
    } finally {
      setLoading(false);
    }
  }

  function getDateRange(period: string) {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case "weekly": {
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      }
      case "yearly": {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      }
      default: {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    }

    return {
      startDate: start.toISOString().split("T")[0]!,
      endDate: end.toISOString().split("T")[0]!,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { startDate, endDate } = getDateRange(period);

    if (!currentUser) return;
    try {
      await createGoal(currentUser.id, {
        title,
        description,
        targetCo2Kg: parseFloat(targetKg),
        period,
        startDate,
        endDate,
      });
      setShowForm(false);
      setTitle("");
      setDescription("");
      setTargetKg("");
      loadGoals();
    } catch (err) {
      console.error("Failed to create goal:", err);
    }
  }

  async function handleStatusChange(goalId: string, status: string) {
    try {
      await updateGoal(goalId, { status } as Partial<Goal>);
      loadGoals();
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  }

  async function handleDelete(goalId: string) {
    try {
      await deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error("Failed to delete goal:", err);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Goals</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Set and track your emission reduction goals</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Create Goal Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Goal</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g., Reduce monthly emissions"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target (kg CO2)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={targetKg}
                onChange={(e) => setTargetKg(e.target.value)}
                className="input-field"
                placeholder="e.g., 100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="select-field">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
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
                placeholder="Details about this goal"
              />
            </div>

            <div className="flex items-end gap-2 md:col-span-2">
              <button type="submit" className="btn-primary">Create Goal</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="card text-center py-12">
            <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No goals yet. Create one to start tracking!</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = goal.progress_percentage ?? 0;
            const isOverBudget = progress > 100;
            const progressColor = isOverBudget ? "bg-red-500" : progress > 75 ? "bg-amber-500" : "bg-eco-500";

            return (
              <div key={goal.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          goal.status === "active"
                            ? "bg-eco-100 text-eco-800 dark:bg-eco-900/30 dark:text-eco-300"
                            : goal.status === "completed"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {goal.status}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{goal.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {goal.period} &middot; {goal.start_date} to {goal.end_date}
                    </p>
                  </div>

                  {goal.status === "active" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStatusChange(goal.id, "completed")}
                        className="p-1.5 text-gray-400 hover:text-eco-500 transition-colors"
                        title="Mark completed"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {(goal.current_co2_kg ?? 0).toFixed(1)} / {goal.target_co2_kg} kg CO2
                    </span>
                    <span className={`font-medium ${isOverBudget ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  {goal.remaining_kg !== undefined && goal.remaining_kg > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {goal.remaining_kg.toFixed(1)} kg remaining in budget
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
