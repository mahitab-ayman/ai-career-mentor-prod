import {
  boolean,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── User Profiles ────────────────────────────────────────────────────────────
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currentRole: varchar("currentRole", { length: 200 }),
  targetRole: varchar("targetRole", { length: 200 }),
  skills: json("skills").$type<string[]>().default([]),
  yearsOfExperience: int("yearsOfExperience").default(0),
  industry: varchar("industry", { length: 100 }),
  education: varchar("education", { length: 200 }),
  bio: text("bio"),
  careerGoals: text("careerGoals"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// ─── Chat Sessions ────────────────────────────────────────────────────────────
export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).default("New Conversation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ChatSession = typeof chatSessions.$inferSelect;

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ChatMessage = typeof chatMessages.$inferSelect;

// ─── Career Path Recommendations ──────────────────────────────────────────────
export const careerPathRecommendations = mysqlTable("career_path_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  pathTitle: varchar("pathTitle", { length: 200 }).notNull(),
  description: text("description"),
  skills: json("skills").$type<string[]>().default([]),
  timelineMonths: int("timelineMonths"),
  salaryRange: varchar("salaryRange", { length: 100 }),
  matchScore: int("matchScore"),
  isSaved: boolean("isSaved").default(false),
  resources: json("resources").$type<{ title: string; url: string; type: string }[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CareerPath = typeof careerPathRecommendations.$inferSelect;

// ─── Learning Roadmaps ────────────────────────────────────────────────────────
export const learningRoadmaps = mysqlTable("learning_roadmaps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  targetRole: varchar("targetRole", { length: 200 }),
  totalStages: int("totalStages").default(0),
  completedStages: int("completedStages").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LearningRoadmap = typeof learningRoadmaps.$inferSelect;

export const roadmapStages = mysqlTable("roadmap_stages", {
  id: int("id").autoincrement().primaryKey(),
  roadmapId: int("roadmapId").notNull(),
  stageNumber: int("stageNumber").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  skills: json("skills").$type<string[]>().default([]),
  resources: json("resources").$type<{ title: string; url: string; type: string }[]>().default([]),
  estimatedWeeks: int("estimatedWeeks"),
  isCompleted: boolean("isCompleted").default(false),
  completedAt: timestamp("completedAt"),
});
export type RoadmapStage = typeof roadmapStages.$inferSelect;

// ─── CV Documents & Analyses ──────────────────────────────────────────────────
export const cvDocuments = mysqlTable("cv_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  filename: varchar("filename", { length: 300 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CvDocument = typeof cvDocuments.$inferSelect;

export const cvAnalyses = mysqlTable("cv_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentId: int("documentId"),
  overallScore: int("overallScore"),
  strengths: json("strengths").$type<string[]>().default([]),
  improvements: json("improvements").$type<string[]>().default([]),
  keySkills: json("keySkills").$type<string[]>().default([]),
  suggestions: text("suggestions"),
  atsScore: int("atsScore"),
  fullAnalysis: text("fullAnalysis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CvAnalysis = typeof cvAnalyses.$inferSelect;

// ─── Interview Sessions ───────────────────────────────────────────────────────
export const interviewSessions = mysqlTable("interview_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jobRole: varchar("jobRole", { length: 200 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  totalQuestions: int("totalQuestions").default(5),
  status: mysqlEnum("status", ["active", "completed"]).default("active"),
  overallScore: float("overallScore"),
  feedback: text("feedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type InterviewSession = typeof interviewSessions.$inferSelect;

export const interviewQA = mysqlTable("interview_qa", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  questionNumber: int("questionNumber").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  score: int("score"),
  feedback: text("feedback"),
  strengths: text("strengths"),
  improvements: text("improvements"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InterviewQA = typeof interviewQA.$inferSelect;

// ─── LinkedIn Analyses ────────────────────────────────────────────────────────
export const linkedinAnalyses = mysqlTable("linkedin_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileText: text("profileText").notNull(),
  overallScore: int("overallScore"),
  headlineSuggestion: text("headlineSuggestion"),
  summarySuggestion: text("summarySuggestion"),
  skillsSuggestion: text("skillsSuggestion"),
  fullAnalysis: text("fullAnalysis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LinkedinAnalysis = typeof linkedinAnalyses.$inferSelect;

// ─── Weekly Notifications ─────────────────────────────────────────────────────
export const weeklyNotifications = mysqlTable("weekly_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WeeklyNotification = typeof weeklyNotifications.$inferSelect;

// ─── Notification Schedule Settings ──────────────────────────────────────────
export const notificationSettings = mysqlTable("notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  isEnabled: boolean("isEnabled").default(false),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type NotificationSetting = typeof notificationSettings.$inferSelect;
