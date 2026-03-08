import dotenv from "dotenv";
dotenv.config();

import db, { initializeDatabase } from "./database";
import { v4 as uuidv4 } from "uuid";
import { calculateEmission } from "./utils/carbonCalculator";

initializeDatabase();

// Migrate: add new columns if they don't exist on older databases
const columns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
const columnNames = columns.map((c) => c.name);
if (!columnNames.includes("avatar_color")) {
  db.exec("ALTER TABLE users ADD COLUMN avatar_color TEXT DEFAULT '#22c55e'");
}
if (!columnNames.includes("units")) {
  db.exec("ALTER TABLE users ADD COLUMN units TEXT DEFAULT 'metric'");
}
if (!columnNames.includes("grid_region")) {
  db.exec("ALTER TABLE users ADD COLUMN grid_region TEXT DEFAULT 'global_avg'");
}

const USER_ID = "default-user-001";

// Create default user
db.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, avatar_color, units, grid_region)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(USER_ID, "Demo User", "demo@ecotracker.local", "#22c55e", "metric", "global_avg");

// Create a second family member for demo
db.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, avatar_color, units, grid_region)
  VALUES (?, ?, ?, ?, ?, ?)
`).run("family-user-002", "Alex Green", "alex@ecotracker.local", "#3b82f6", "metric", "global_avg");

// Sample activities for the past 30 days
const activities = [
  // Transport
  { category: "transport", type: "car_petrol", value: 25, unit: "km", daysAgo: 1 },
  { category: "transport", type: "bus", value: 15, unit: "km", daysAgo: 2 },
  { category: "transport", type: "train", value: 80, unit: "km", daysAgo: 3 },
  { category: "transport", type: "car_petrol", value: 40, unit: "km", daysAgo: 5 },
  { category: "transport", type: "bicycle", value: 10, unit: "km", daysAgo: 6 },
  { category: "transport", type: "car_electric", value: 30, unit: "km", daysAgo: 8 },
  { category: "transport", type: "plane_domestic", value: 500, unit: "km", daysAgo: 14 },
  { category: "transport", type: "car_petrol", value: 20, unit: "km", daysAgo: 18 },
  { category: "transport", type: "bus", value: 12, unit: "km", daysAgo: 22 },
  { category: "transport", type: "walking", value: 5, unit: "km", daysAgo: 25 },

  // Energy
  { category: "energy", type: "electricity", value: 12, unit: "kWh", daysAgo: 1 },
  { category: "energy", type: "natural_gas", value: 3, unit: "m3", daysAgo: 1 },
  { category: "energy", type: "electricity", value: 15, unit: "kWh", daysAgo: 4 },
  { category: "energy", type: "electricity", value: 10, unit: "kWh", daysAgo: 7 },
  { category: "energy", type: "natural_gas", value: 4, unit: "m3", daysAgo: 10 },
  { category: "energy", type: "electricity", value: 18, unit: "kWh", daysAgo: 15 },
  { category: "energy", type: "electricity", value: 11, unit: "kWh", daysAgo: 20 },
  { category: "energy", type: "natural_gas", value: 2.5, unit: "m3", daysAgo: 24 },

  // Food
  { category: "food", type: "beef", value: 0.3, unit: "kg", daysAgo: 2 },
  { category: "food", type: "chicken", value: 0.5, unit: "kg", daysAgo: 3 },
  { category: "food", type: "vegetables", value: 1.5, unit: "kg", daysAgo: 4 },
  { category: "food", type: "plant_based_meal", value: 1, unit: "meal", daysAgo: 5 },
  { category: "food", type: "dairy", value: 0.5, unit: "kg", daysAgo: 6 },
  { category: "food", type: "fish", value: 0.3, unit: "kg", daysAgo: 9 },
  { category: "food", type: "mixed_meal", value: 2, unit: "meal", daysAgo: 11 },
  { category: "food", type: "beef", value: 0.25, unit: "kg", daysAgo: 16 },
  { category: "food", type: "vegetables", value: 2, unit: "kg", daysAgo: 19 },
  { category: "food", type: "grains", value: 1, unit: "kg", daysAgo: 23 },

  // Waste
  { category: "waste", type: "general_waste", value: 5, unit: "kg", daysAgo: 7 },
  { category: "waste", type: "recycling", value: 3, unit: "kg", daysAgo: 7 },
  { category: "waste", type: "compost", value: 2, unit: "kg", daysAgo: 14 },
  { category: "waste", type: "general_waste", value: 4, unit: "kg", daysAgo: 21 },
  { category: "waste", type: "recycling", value: 4, unit: "kg", daysAgo: 21 },
];

const insertActivity = db.prepare(`
  INSERT INTO activities (id, user_id, category, type, description, value, unit, date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertEmission = db.prepare(`
  INSERT INTO emissions (id, activity_id, user_id, co2_kg, category, date)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const seedTransaction = db.transaction(() => {
  // Clear existing data
  db.prepare("DELETE FROM emissions WHERE user_id = ?").run(USER_ID);
  db.prepare("DELETE FROM activities WHERE user_id = ?").run(USER_ID);
  db.prepare("DELETE FROM goals WHERE user_id = ?").run(USER_ID);

  for (const activity of activities) {
    const activityId = uuidv4();
    const emissionId = uuidv4();
    const date = new Date();
    date.setDate(date.getDate() - activity.daysAgo);
    const dateStr = date.toISOString().split("T")[0];
    const co2Kg = calculateEmission(activity.category, activity.type, activity.value);

    insertActivity.run(
      activityId, USER_ID, activity.category, activity.type,
      `${activity.type.replace(/_/g, " ")} activity`,
      activity.value, activity.unit, dateStr
    );

    insertEmission.run(emissionId, activityId, USER_ID, co2Kg, activity.category, dateStr);
  }

  // Add sample goals
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  db.prepare(`
    INSERT INTO goals (id, user_id, title, description, target_co2_kg, period, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(), USER_ID,
    "Reduce weekly emissions",
    "Keep total weekly carbon emissions under 50 kg CO2",
    50, "weekly",
    weekStart.toISOString().split("T")[0],
    weekEnd.toISOString().split("T")[0]
  );

  db.prepare(`
    INSERT INTO goals (id, user_id, title, description, target_co2_kg, period, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(), USER_ID,
    "Monthly target: 150 kg CO2",
    "Stay under 150 kg CO2 for the month across all categories",
    150, "monthly",
    monthStart.toISOString().split("T")[0],
    monthEnd.toISOString().split("T")[0]
  );
});

seedTransaction();
console.log("Database seeded successfully with demo data!");
console.log(`User ID: ${USER_ID}`);
