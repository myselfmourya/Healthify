import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const healthProfiles = pgTable("health_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Refs users.id in real DB
  age: text("age"),
  gender: text("gender"),
  bloodPressure: text("blood_pressure"),
  glucose: text("glucose"),
  heartRate: text("heart_rate"),
  bmi: text("bmi"),
  diseases: text("diseases"), // Stored as JSON string
  allergies: text("allergies"), // Stored as JSON string
  bloodGroup: text("blood_group"),

  // Persisted Deterministic Scores
  healthScore: text("health_score"), // /1000
  cardiacRisk: text("cardiac_risk"), // %
  diabetesRisk: text("diabetes_risk"), // %
  mentalScore: text("mental_score"), // 1-100
  lifestyleScore: text("lifestyle_score"), // 1-100

  // Version Tracking
  algorithmVersion: text("algorithm_version").default("1.0.0").notNull(),
  scoreHistory: text("score_history"), // JSON string array

  // App state
  activeMode: text("active_mode").default("Beginner").notNull(),
  quizMemory: text("quiz_memory"), // JSON string mapping domain -> asked_question_ids
  lastUpdated: text("last_updated").notNull(),
});

export type HealthProfile = typeof healthProfiles.$inferSelect;
export type InsertHealthProfile = typeof healthProfiles.$inferInsert;

export const timelineEvents = pgTable("timeline_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // 'Scan', 'MentalLog', 'ScoreUpdate', 'MedicineAdded'
  title: text("title").notNull(),
  description: text("description"),
  timestamp: text("timestamp").notNull(),
  metadata: text("metadata"), // JSON string
});

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = typeof timelineEvents.$inferInsert;
