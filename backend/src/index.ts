import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { initializeDatabase } from "./database";
import usersRouter from "./routes/users";
import activitiesRouter from "./routes/activities";
import emissionsRouter from "./routes/emissions";
import goalsRouter from "./routes/goals";
import reportsRouter from "./routes/reports";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// Initialize database
initializeDatabase();
console.log("Database initialized");

// Routes
app.use("/api/users", usersRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/emissions", emissionsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/reports", reportsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`EcoTracker Pro API running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
