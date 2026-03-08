export interface Activity {
  id: string;
  user_id: string;
  category: ActivityCategory;
  type: string;
  description: string;
  value: number;
  unit: string;
  date: string;
  created_at: string;
}

export type ActivityCategory = "transport" | "energy" | "food" | "shopping" | "waste";

export interface Emission {
  id: string;
  activity_id: string;
  user_id: string;
  co2_kg: number;
  category: string;
  date: string;
  created_at: string;
}

export interface EmissionSummary {
  period: string;
  category: string;
  total_co2_kg: number;
  activity_count: number;
}

export interface EmissionByCategory {
  category: string;
  total_co2_kg: number;
  activity_count: number;
  avg_co2_kg: number;
}

export interface EmissionStats {
  total_co2_kg: number;
  avg_per_activity: number;
  total_activities: number;
  weekly_co2_kg: number;
  monthly_co2_kg: number;
}

export interface EmissionTrend {
  date: string;
  total_co2_kg: number;
  activity_count: number;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_co2_kg: number;
  period: "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date: string;
  status: "active" | "completed" | "failed" | "cancelled";
  created_at: string;
  current_co2_kg?: number;
  progress_percentage?: number;
  remaining_kg?: number;
}

export interface McpServerStatus {
  name: string;
  enabled: boolean;
  description: string;
  capabilities: string[];
}

export interface EcoTip {
  tip: string;
  category: string;
}

export interface WeeklyReport {
  daily: Array<{ date: string; category: string; daily_co2: number }>;
  byCategory: Array<{ category: string; total_co2: number; count: number }>;
  totalCo2Kg: number;
  period: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
  units: string;
  grid_region: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
