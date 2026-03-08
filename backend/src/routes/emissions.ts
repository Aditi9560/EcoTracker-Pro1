import { Router, Request, Response } from "express";
import db from "../database";

const router = Router();

// Get emission summary for a user
router.get("/summary/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const { period = "monthly", startDate, endDate } = req.query;

  let dateFormat: string;
  switch (period) {
    case "daily":
      dateFormat = "%Y-%m-%d";
      break;
    case "weekly":
      dateFormat = "%Y-W%W";
      break;
    case "yearly":
      dateFormat = "%Y";
      break;
    default:
      dateFormat = "%Y-%m";
  }

  let query = `
    SELECT
      strftime('${dateFormat}', date) as period,
      category,
      SUM(co2_kg) as total_co2_kg,
      COUNT(*) as activity_count
    FROM emissions
    WHERE user_id = ?
  `;
  const params: unknown[] = [userId];

  if (startDate) {
    query += " AND date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    query += " AND date <= ?";
    params.push(endDate);
  }

  query += ` GROUP BY period, category ORDER BY period DESC`;

  const summary = db.prepare(query).all(...params);
  res.json({ data: summary });
});

// Get total emissions by category for a user
router.get("/by-category/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;

  let query = `
    SELECT
      category,
      SUM(co2_kg) as total_co2_kg,
      COUNT(*) as activity_count,
      AVG(co2_kg) as avg_co2_kg
    FROM emissions
    WHERE user_id = ?
  `;
  const params: unknown[] = [userId];

  if (startDate) {
    query += " AND date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    query += " AND date <= ?";
    params.push(endDate);
  }

  query += " GROUP BY category ORDER BY total_co2_kg DESC";

  const byCategory = db.prepare(query).all(...params);
  res.json({ data: byCategory });
});

// Get daily emissions trend
router.get("/trend/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const { days = "30" } = req.query;

  const trend = db.prepare(`
    SELECT
      date,
      SUM(co2_kg) as total_co2_kg,
      COUNT(*) as activity_count
    FROM emissions
    WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
    GROUP BY date
    ORDER BY date ASC
  `).all(userId, Number(days));

  res.json({ data: trend });
});

// Get overall stats
router.get("/stats/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;

  const stats = db.prepare(`
    SELECT
      COALESCE(SUM(co2_kg), 0) as total_co2_kg,
      COALESCE(AVG(co2_kg), 0) as avg_per_activity,
      COUNT(*) as total_activities,
      COALESCE(SUM(CASE WHEN date >= date('now', '-7 days') THEN co2_kg ELSE 0 END), 0) as weekly_co2_kg,
      COALESCE(SUM(CASE WHEN date >= date('now', '-30 days') THEN co2_kg ELSE 0 END), 0) as monthly_co2_kg
    FROM emissions
    WHERE user_id = ?
  `).get(userId);

  res.json({ data: stats });
});

export default router;
