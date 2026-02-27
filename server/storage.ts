import { type User, type InsertUser, type HealthProfile, type InsertHealthProfile, type TimelineEvent, type InsertTimelineEvent } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getHealthProfile(userId: string): Promise<HealthProfile | undefined>;
  updateHealthProfile(userId: string, data: Partial<HealthProfile>): Promise<HealthProfile>;

  getTimelineEvents(userId: string): Promise<TimelineEvent[]>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private profiles: Map<string, HealthProfile>;
  private timeline: Map<string, TimelineEvent>;

  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.timeline = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);

    // Create default profile
    const profileId = randomUUID();
    this.profiles.set(user.id, {
      id: profileId,
      userId: user.id,
      age: null, gender: null, bloodPressure: null, glucose: null, heartRate: null, bmi: null, diseases: null, allergies: null, bloodGroup: null,
      healthScore: null, cardiacRisk: null, diabetesRisk: null, mentalScore: null, lifestyleScore: null,
      algorithmVersion: "1.0.0",
      scoreHistory: "[]",
      activeMode: "Beginner",
      quizMemory: "{}", // Domain-to-IDs mapping
      lastUpdated: new Date().toISOString()
    });
    return user;
  }

  async getHealthProfile(userId: string): Promise<HealthProfile | undefined> {
    const profile = this.profiles.get(userId);
    if (profile) return profile;

    // Create a default profile on the fly if not exists
    const profileId = randomUUID();
    const newProfile: HealthProfile = {
      id: profileId,
      userId: userId,
      age: null, gender: null, bloodPressure: null, glucose: null, heartRate: null, bmi: null, diseases: null, allergies: null, bloodGroup: null,
      healthScore: null, cardiacRisk: null, diabetesRisk: null, mentalScore: null, lifestyleScore: null,
      algorithmVersion: "1.0.0",
      scoreHistory: "[]",
      activeMode: "Beginner",
      quizMemory: "{}",
      lastUpdated: new Date().toISOString()
    };
    this.profiles.set(userId, newProfile);
    return newProfile;
  }

  async updateHealthProfile(userId: string, data: Partial<HealthProfile>): Promise<HealthProfile> {
    const existing = this.profiles.get(userId);
    if (!existing) throw new Error("Profile not found");

    // Implement score history tracking
    let scoreHistory = existing.scoreHistory ? JSON.parse(existing.scoreHistory) : [];

    // Check if new scores are being provided that differ from existing
    const hasNewScores = (data.healthScore && data.healthScore !== existing.healthScore) ||
      (data.cardiacRisk && data.cardiacRisk !== existing.cardiacRisk) ||
      (data.diabetesRisk && data.diabetesRisk !== existing.diabetesRisk) ||
      (data.mentalScore && data.mentalScore !== existing.mentalScore) ||
      (data.lifestyleScore && data.lifestyleScore !== existing.lifestyleScore);

    if (hasNewScores) {
      scoreHistory.push({
        timestamp: new Date().toISOString(),
        algorithmVersion: existing.algorithmVersion || "1.0.0",
        scores: {
          healthScore: existing.healthScore,
          cardiacRisk: existing.cardiacRisk,
          diabetesRisk: existing.diabetesRisk,
          mentalScore: existing.mentalScore,
          lifestyleScore: existing.lifestyleScore
        }
      });
      data.scoreHistory = JSON.stringify(scoreHistory);
    }

    const updated = { ...existing, ...data, lastUpdated: new Date().toISOString() };
    this.profiles.set(userId, updated);
    return updated;
  }

  async getTimelineEvents(userId: string): Promise<TimelineEvent[]> {
    return Array.from(this.timeline.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
    const id = randomUUID();
    const e = { ...event, id };
    if (!e.timestamp) e.timestamp = new Date().toISOString();
    this.timeline.set(id, e as TimelineEvent);
    return e as TimelineEvent;
  }
}

export const storage = new MemStorage();
