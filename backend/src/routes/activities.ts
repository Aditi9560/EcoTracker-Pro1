import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database";
import { calculateEmission } from "../utils/carbonCalculator";

const router = Router();

// Get all activities for a user
router.get("/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const { category, startDate, endDate, limit = "50", offset = "0" } = req.query;

  let query = "SELECT * FROM activities WHERE user_id = ?";
  const params: unknown[] = [userId];

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  if (startDate) {
    query += " AND date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    query += " AND date <= ?";
    params.push(endDate);
  }

  query += " ORDER BY date DESC LIMIT ? OFFSET ?";
  params.push(Number(limit), Number(offset));

  const activities = db.prepare(query).all(...params);
  res.json({ data: activities });
});

// Create a new activity (auto-calculates emissions)
router.post("/", (req: Request, res: Response) => {
  const { userId, category, type, description, value, unit, date } = req.body;

  if (!userId || !category || !type || value === undefined || !unit || !date) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const co2Kg = calculateEmission(category, type, value);
    const activityId = uuidv4();
    const emissionId = uuidv4();

    const insertActivity = db.prepare(`
      INSERT INTO activities (id, user_id, category, type, description, value, unit, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertEmission = db.prepare(`
      INSERT INTO emissions (id, activity_id, user_id, co2_kg, category, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertActivity.run(activityId, userId, category, type, description || "", value, unit, date);
      insertEmission.run(emissionId, activityId, userId, co2Kg, category, date);
    });

    transaction();

    res.status(201).json({
      data: {
        activity: { id: activityId, userId, category, type, description, value, unit, date },
        emission: { id: emissionId, activityId, co2Kg, category, date },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ error: message });
  }
});

// Update an activity
router.put("/:activityId", (req: Request, res: Response) => {
  const { activityId } = req.params;
  const { category, type, description, value, unit, date } = req.body;

  const existing = db.prepare("SELECT * FROM activities WHERE id = ?").get(activityId) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  const updatedCategory = category || existing.category as string;
  const updatedType = type || existing.type as string;
  const updatedValue = value !== undefined ? value : existing.value as number;

  try {
    const co2Kg = calculateEmission(updatedCategory, updatedType, updatedValue);

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE activities SET category = ?, type = ?, description = ?, value = ?, unit = ?, date = ?
        WHERE id = ?
      `).run(
        updatedCategory,
        updatedType,
        description !== undefined ? description : existing.description,
        updatedValue,
        unit || existing.unit,
        date || existing.date,
        activityId
      );

      db.prepare("UPDATE emissions SET co2_kg = ?, category = ?, date = ? WHERE activity_id = ?").run(
        co2Kg,
        updatedCategory,
        date || existing.date,
        activityId
      );
    });

    transaction();
    res.json({ data: { message: "Activity updated", co2Kg } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ error: message });
  }
});

// Delete an activity
router.delete("/:activityId", (req: Request, res: Response) => {
  const { activityId } = req.params;
  const result = db.prepare("DELETE FROM activities WHERE id = ?").run(activityId);

  if (result.changes === 0) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  res.json({ data: { message: "Activity deleted" } });
});

export default router;
