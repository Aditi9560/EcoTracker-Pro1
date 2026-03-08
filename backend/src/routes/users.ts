import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database";

const router = Router();

const AVATAR_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#06b6d4",
];

// List all users
router.get("/", (_req: Request, res: Response) => {
  const users = db.prepare(`
    SELECT id, name, email, avatar_color, units, grid_region, created_at, updated_at
    FROM users ORDER BY created_at ASC
  `).all();
  res.json({ data: users });
});

// Get single user
router.get("/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = db.prepare(`
    SELECT id, name, email, avatar_color, units, grid_region, created_at, updated_at
    FROM users WHERE id = ?
  `).get(userId);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ data: user });
});

// Create a new user
router.post("/", (req: Request, res: Response) => {
  const { name, email } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  if (!email || !email.trim()) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  // Check for duplicate email
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }

  const id = uuidv4();
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  db.prepare(`
    INSERT INTO users (id, name, email, avatar_color, units, grid_region)
    VALUES (?, ?, ?, ?, 'metric', 'global_avg')
  `).run(id, name.trim(), email.trim(), avatarColor);

  const user = db.prepare(`
    SELECT id, name, email, avatar_color, units, grid_region, created_at, updated_at
    FROM users WHERE id = ?
  `).get(id);

  res.status(201).json({ data: user });
});

// Update user profile
router.put("/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const { name, email, avatarColor, units, gridRegion } = req.body;

  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Check email uniqueness if changing email
  if (email && email !== existing.email) {
    const emailTaken = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, userId);
    if (emailTaken) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }
  }

  db.prepare(`
    UPDATE users
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        avatar_color = COALESCE(?, avatar_color),
        units = COALESCE(?, units),
        grid_region = COALESCE(?, grid_region),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name?.trim() || null,
    email?.trim() || null,
    avatarColor || null,
    units || null,
    gridRegion || null,
    userId
  );

  const updated = db.prepare(`
    SELECT id, name, email, avatar_color, units, grid_region, created_at, updated_at
    FROM users WHERE id = ?
  `).get(userId);

  res.json({ data: updated });
});

// Delete user and all their data
router.delete("/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;

  const existing = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // CASCADE will clean up activities, emissions, and goals
  const result = db.prepare("DELETE FROM users WHERE id = ?").run(userId);

  if (result.changes === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ data: { message: "User and all associated data deleted" } });
});

export default router;
