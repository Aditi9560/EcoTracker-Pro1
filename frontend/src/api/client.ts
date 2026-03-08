import type {
  Activity,
  ApiResponse,
  EmissionByCategory,
  EmissionStats,
  EmissionSummary,
  EmissionTrend,
  Goal,
  McpServerStatus,
  EcoTip,
  WeeklyReport,
  User,
} from "../types";

const API_BASE = import.meta.env.DEV ? "/api" : "https://ecotracker-pro1.onrender.com/api";

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}

// ── Users ──

export async function getUsers() {
  return fetchApi<User[]>("/users");
}

export async function getUser(userId: string) {
  return fetchApi<User>(`/users/${userId}`);
}

export async function createUser(data: { name: string; email: string }) {
  return fetchApi<User>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(userId: string, data: {
  name?: string;
  email?: string;
  avatarColor?: string;
  units?: string;
  gridRegion?: string;
}) {
  return fetchApi<User>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: string) {
  return fetchApi<{ message: string }>(`/users/${userId}`, {
    method: "DELETE",
  });
}

// ── Activities ──

export async function getActivities(userId: string, params?: {
  category?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  return fetchApi<Activity[]>(`/activities/${userId}${qs ? `?${qs}` : ""}`);
}

export async function createActivity(userId: string, data: {
  category: string;
  type: string;
  description?: string;
  value: number;
  unit: string;
  date: string;
}) {
  return fetchApi<{ activity: Activity; emission: { co2Kg: number } }>("/activities", {
    method: "POST",
    body: JSON.stringify({ userId, ...data }),
  });
}

export async function deleteActivity(activityId: string) {
  return fetchApi<{ message: string }>(`/activities/${activityId}`, {
    method: "DELETE",
  });
}

// ── Emissions ──

export async function getEmissionSummary(userId: string, period: string = "monthly") {
  return fetchApi<EmissionSummary[]>(`/emissions/summary/${userId}?period=${period}`);
}

export async function getEmissionsByCategory(userId: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();
  return fetchApi<EmissionByCategory[]>(`/emissions/by-category/${userId}${qs ? `?${qs}` : ""}`);
}

export async function getEmissionTrend(userId: string, days: number = 30) {
  return fetchApi<EmissionTrend[]>(`/emissions/trend/${userId}?days=${days}`);
}

export async function getEmissionStats(userId: string) {
  return fetchApi<EmissionStats>(`/emissions/stats/${userId}`);
}

// ── Goals ──

export async function getGoals(userId: string, status?: string) {
  const qs = status ? `?status=${status}` : "";
  return fetchApi<Goal[]>(`/goals/${userId}${qs}`);
}

export async function createGoal(userId: string, data: {
  title: string;
  description?: string;
  targetCo2Kg: number;
  period: string;
  startDate: string;
  endDate: string;
}) {
  return fetchApi<Goal>("/goals", {
    method: "POST",
    body: JSON.stringify({ userId, ...data }),
  });
}

export async function updateGoal(goalId: string, data: Partial<Goal>) {
  return fetchApi<{ message: string }>(`/goals/${goalId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteGoal(goalId: string) {
  return fetchApi<{ message: string }>(`/goals/${goalId}`, {
    method: "DELETE",
  });
}

// ── Reports ──

export async function getWeeklyReport(userId: string, weeksBack: number = 0) {
  return fetchApi<WeeklyReport>(`/reports/weekly/${userId}?weeksBack=${weeksBack}`);
}

export async function getMonthlyReport(userId: string, monthsBack: number = 0) {
  return fetchApi<WeeklyReport>(`/reports/monthly/${userId}?monthsBack=${monthsBack}`);
}

export async function getEmissionFactors() {
  return fetchApi<Record<string, Record<string, { factor: number; unit: string }>>>("/reports/emission-factors");
}

// ── MCP / Data Sources ──

export async function getDataSources() {
  return fetchApi<McpServerStatus[]>("/reports/data-sources");
}

export async function getEcoTips() {
  return fetchApi<EcoTip[]>("/reports/eco-tips");
}
