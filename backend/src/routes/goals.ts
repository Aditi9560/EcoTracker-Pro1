import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database";

const router = Router();

// Get all goals for a user
router.get("/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status } = req.query;

  let query = "SELECT * FROM goals WHERE user_id = ?";
  const params: unknown[] = [userId];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  query += " ORDER BY created_at DESC";

  const goals = db.prepare(query).all(...params);

  // Calculate progress for each goal
  const goalsWithProgress = goals.map((goal: any) => {
    const emissions = db.prepare(`
      SELECT COALESCE(SUM(co2_kg), 0) as total
      FROM emissions
      WHERE user_id = ? AND date >= ? AND date <= ?
    `).get(userId, goal.start_date, goal.end_date) as { total: number };

    return {
      ...goal,
      current_co2_kg: emissions.total,
      progress_percentage: goal.target_co2_kg > 0
        ? Math.round((emissions.total / goal.target_co2_kg) * 100)
        : 0,
      remaining_kg: Math.max(0, goal.target_co2_kg - emissions.total),
    };
  });

  res.json({ data: goalsWithProgress });
});

// Create a new goal
router.post("/", (req: Request, res: Response) => {
  const { userId, title, description, targetCo2Kg, period, startDate, endDate } = req.body;

  if (!userId || !title || !targetCo2Kg || !period || !startDate || !endDate) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const id = uuidv4();

  db.prepare(`
    INSERT INTO goals (id, user_id, title, description, target_co2_kg, period, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, title, description || "", targetCo2Kg, period, startDate, endDate);

  res.status(201).json({
    data: { id, userId, title, description, targetCo2Kg, period, startDate, endDate, status: "active" },
  });
});

// Update a goal
router.put("/:goalId", (req: Request, res: Response) => {
  const { goalId } = req.params;
  const { title, description, targetCo2Kg, status } = req.body;

  const existing = db.prepare("SELECT * FROM goals WHERE id = ?").get(goalId);
  if (!existing) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  db.prepare(`
    UPDATE goals
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        target_co2_kg = COALESCE(?, target_co2_kg),
        status = COALESCE(?, status)
    WHERE id = ?
  `).run(title, description, targetCo2Kg, status, goalId);

  res.json({ data: { message: "Goal updated" } });
});

// Delete a goal
router.delete("/:goalId", (req: Request, res: Response) => {
  const { goalId } = req.params;
  const result = db.prepare("DELETE FROM goals WHERE id = ?").run(goalId);

  if (result.changes === 0) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  res.json({ data: { message: "Goal deleted" } });
});

export default router;
