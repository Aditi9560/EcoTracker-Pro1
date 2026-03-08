import { Router, Request, Response } from "express";
import db from "../database";
import { EMISSION_FACTORS } from "../utils/carbonCalculator";
import { mcpClient } from "../mcp/client";

const router = Router();

// Get weekly report
router.get("/weekly/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const { weeksBack = "0" } = req.query;

  const offset = Number(weeksBack);

  const report = db.prepare(`
    SELECT
      date,
      category,
      SUM(co2_kg) as daily_co2
    FROM emissions
    WHERE user_id = ?
      AND date >= date('now', 'weekday 0', '-' || (7 + ? * 7) || ' days')
      AND date < date('now', 'weekday 0', '-' || (? * 7) || ' days')
    GROUP BY date, category
    ORDER BY date ASC
  `).all(userId, offset, offset);

  const totals = db.prepare(`
    SELECT
      category,
      SUM(co2_kg) as total_co2,
      COUNT(*) as count
    FROM emissions
    WHERE user_id = ?
      AND date >= date('now', 'weekday 0', '-' || (7 + ? * 7) || ' days')
      AND date < date('now', 'weekday 0', '-' || (? * 7) || ' days')
    GROUP BY category
  `).all(userId, offset, offset);

  const grandTotal = db.prepare(`
    SELECT COALESCE(SUM(co2_kg), 0) as total
    FROM emissions
    WHERE user_id = ?
      AND date >= date('now', 'weekday 0', '-' || (7 + ? * 7) || ' days')
      AND date < date('now', 'weekday 0', '-' || (? * 7) || ' days')
  `).get(userId, offset, offset) as { total: number };

  res.json({
    data: {
      daily: report,
      byCategory: totals,
      totalCo2Kg: grandTotal.total,
      period: "weekly",
    },
  });
});

// Get monthly report
router.get("/monthly/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const { monthsBack = "0" } = req.query;

  const offset = Number(monthsBack);

  const report = db.prepare(`
    SELECT
      date,
      category,
      SUM(co2_kg) as daily_co2
    FROM emissions
    WHERE user_id = ?
      AND date >= date('now', 'start of month', '-' || ? || ' months')
      AND date < date('now', 'start of month', '-' || (? - 1) || ' months')
    GROUP BY date, category
    ORDER BY date ASC
  `).all(userId, offset, Math.max(0, offset - 1));

  const totals = db.prepare(`
    SELECT
      category,
      SUM(co2_kg) as total_co2,
      COUNT(*) as count,
      AVG(co2_kg) as avg_co2
    FROM emissions
    WHERE user_id = ?
      AND date >= date('now', 'start of month', '-' || ? || ' months')
      AND date < date('now', 'start of month', '-' || (? - 1) || ' months')
    GROUP BY category
  `).all(userId, offset, Math.max(0, offset - 1));

  const grandTotal = db.prepare(`
    SELECT COALESCE(SUM(co2_kg), 0) as total
    FROM emissions
    WHERE user_id = ?
      AND date >= date('now', 'start of month', '-' || ? || ' months')
      AND date < date('now', 'start of month', '-' || (? - 1) || ' months')
  `).get(userId, offset, Math.max(0, offset - 1)) as { total: number };

  res.json({
    data: {
      daily: report,
      byCategory: totals,
      totalCo2Kg: grandTotal.total,
      period: "monthly",
    },
  });
});

// Get emission factors reference
router.get("/emission-factors", (_req: Request, res: Response) => {
  res.json({ data: EMISSION_FACTORS });
});

// Get MCP data sources status
router.get("/data-sources", (_req: Request, res: Response) => {
  const status = mcpClient.getServerStatus();
  res.json({ data: status });
});

// Get eco tips via MCP
router.get("/eco-tips", async (_req: Request, res: Response) => {
  const result = await mcpClient.getEcoTips();
  if (result.success) {
    res.json({ data: result.data });
  } else {
    // Return default tips when MCP is not configured
    res.json({
      data: [
        { tip: "Walk or cycle for short trips instead of driving", category: "transport" },
        { tip: "Switch to LED bulbs to reduce energy consumption by up to 75%", category: "energy" },
        { tip: "Try having one meat-free day per week", category: "food" },
        { tip: "Unplug electronics when not in use to avoid phantom energy draw", category: "energy" },
        { tip: "Use reusable bags, bottles, and containers to reduce waste", category: "waste" },
      ],
    });
  }
});

export default router;
