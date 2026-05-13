import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  CareerPath, CvAnalysis, CvDocument, InsertUser, InterviewQA, InterviewSession,
  LearningRoadmap, LinkedinAnalysis, NotificationSetting, RoadmapStage,
  UserProfile, WeeklyNotification,
  careerPathRecommendations, chatMessages, chatSessions, cvAnalyses, cvDocuments,
  interviewQA, interviewSessions, learningRoadmaps, linkedinAnalyses,
  notificationSettings, roadmapStages, userProfiles, users, weeklyNotifications,
  InsertUserProfile,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── User Profiles ────────────────────────────────────────────────────────────
export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertUserProfile(data: InsertUserProfile): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(userProfiles).values(data).onDuplicateKeyUpdate({ set: data });
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { chatSessions: 0, savedPaths: 0, completedInterviews: 0, cvAnalyses: 0, profileCompletion: 20 };
  const [sessions, paths, interviews, cvs, profile] = await Promise.all([
    db.select().from(chatSessions).where(eq(chatSessions.userId, userId)),
    db.select().from(careerPathRecommendations).where(and(eq(careerPathRecommendations.userId, userId), eq(careerPathRecommendations.isSaved, true))),
    db.select().from(interviewSessions).where(and(eq(interviewSessions.userId, userId), eq(interviewSessions.status, "completed"))),
    db.select().from(cvAnalyses).where(eq(cvAnalyses.userId, userId)),
    getUserProfile(userId),
  ]);
  let completion = 20;
  if (profile) {
    if (profile.currentRole) completion += 15;
    if (profile.targetRole) completion += 15;
    if (profile.skills && (profile.skills as string[]).length > 0) completion += 20;
    if (profile.careerGoals) completion += 15;
    if (profile.education) completion += 10;
    if (profile.bio) completion += 5;
  }
  return { chatSessions: sessions.length, savedPaths: paths.length, completedInterviews: interviews.length, cvAnalyses: cvs.length, profileCompletion: Math.min(completion, 100) };
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export async function createChatSession(userId: number, title?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatSessions).values({ userId, title: title ?? "New Conversation" });
  return { sessionId: (result as any)[0]?.insertId ?? (result as any).insertId as number };
}

export async function getChatSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt));
}

export async function getChatMessages(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.userId, userId))).orderBy(chatMessages.createdAt);
}

export async function saveChatMessage(data: { sessionId: number; userId: number; role: "user" | "assistant"; content: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatMessages).values(data);
}

export async function updateChatSessionTitle(sessionId: number, title: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatSessions).set({ title }).where(eq(chatSessions.id, sessionId));
}

export async function deleteChatSession(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(chatMessages).where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.userId, userId)));
  await db.delete(chatSessions).where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
}

// ─── Career Paths ─────────────────────────────────────────────────────────────
export async function saveCareerPath(data: Omit<CareerPath, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(careerPathRecommendations).values(data);
  return { id: (result as any)[0]?.insertId ?? (result as any).insertId as number };
}

export async function getCareerPaths(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(careerPathRecommendations).where(eq(careerPathRecommendations.userId, userId)).orderBy(desc(careerPathRecommendations.createdAt));
}

export async function toggleSaveCareerPath(id: number, userId: number, isSaved: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(careerPathRecommendations).set({ isSaved }).where(and(eq(careerPathRecommendations.id, id), eq(careerPathRecommendations.userId, userId)));
}

// ─── CV ───────────────────────────────────────────────────────────────────────
export async function saveCvDocument(data: Omit<CvDocument, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cvDocuments).values(data);
  return { id: (result as any)[0]?.insertId ?? (result as any).insertId as number };
}

export async function saveCvAnalysis(data: Omit<CvAnalysis, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cvAnalyses).values(data);
  return { id: (result as any)[0]?.insertId ?? (result as any).insertId as number };
}

export async function getCvAnalyses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cvAnalyses).where(eq(cvAnalyses.userId, userId)).orderBy(desc(cvAnalyses.createdAt));
}

// ─── Interview ────────────────────────────────────────────────────────────────
export async function createInterviewSession(data: Omit<InterviewSession, "id" | "createdAt" | "completedAt" | "overallScore" | "feedback">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(interviewSessions).values(data);
  return { sessionId: (result as any)[0]?.insertId ?? (result as any).insertId as number };
}

export async function getInterviewSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviewSessions).where(eq(interviewSessions.userId, userId)).orderBy(desc(interviewSessions.createdAt));
}

export async function saveInterviewQA(data: Omit<InterviewQA, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(interviewQA).values(data);
}

export async function getInterviewQA(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviewQA).where(eq(interviewQA.sessionId, sessionId)).orderBy(interviewQA.questionNumber);
}

export async function completeInterviewSession(sessionId: number, overallScore: number, feedback: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(interviewSessions).set({ status: "completed", overallScore, feedback, completedAt: new Date() }).where(eq(interviewSessions.id, sessionId));
}

// ─── Learning Roadmap ─────────────────────────────────────────────────────────
export async function createRoadmap(data: { userId: number; title: string; targetRole: string; totalStages: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(learningRoadmaps).values(data);
  return { roadmapId: (result as any)[0]?.insertId ?? (result as any).insertId as number };
}

export async function saveRoadmapStages(stages: { roadmapId: number; stageNumber: number; title: string; description?: string | null; skills?: string[] | null; resources?: { title: string; url: string; type: string }[] | null; estimatedWeeks?: number | null; isCompleted?: boolean | null }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (stages.length === 0) return;
  // Use raw SQL to bypass Drizzle's default value handling for notNull int columns
  for (const stage of stages) {
    const skillsJson = JSON.stringify(stage.skills ?? []);
    const resourcesJson = JSON.stringify(stage.resources ?? []);
    await db.execute(
      sql`INSERT INTO roadmap_stages (roadmapId, stageNumber, title, description, skills, resources, estimatedWeeks, isCompleted) VALUES (${stage.roadmapId}, ${stage.stageNumber}, ${stage.title}, ${stage.description ?? null}, ${skillsJson}, ${resourcesJson}, ${stage.estimatedWeeks ?? null}, ${stage.isCompleted ? 1 : 0})`
    );
  }
}

export async function getRoadmaps(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(learningRoadmaps).where(eq(learningRoadmaps.userId, userId)).orderBy(desc(learningRoadmaps.createdAt));
}

export async function getRoadmapWithStages(roadmapId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [roadmap] = await db.select().from(learningRoadmaps).where(and(eq(learningRoadmaps.id, roadmapId), eq(learningRoadmaps.userId, userId))).limit(1);
  if (!roadmap) return null;
  const stages = await db.select().from(roadmapStages).where(eq(roadmapStages.roadmapId, roadmapId)).orderBy(roadmapStages.stageNumber);
  return { ...roadmap, stages };
}

export async function markStageComplete(stageId: number, roadmapId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(roadmapStages).set({ isCompleted: true, completedAt: new Date() }).where(eq(roadmapStages.id, stageId));
  const stages = await db.select().from(roadmapStages).where(eq(roadmapStages.roadmapId, roadmapId));
  const completed = stages.filter(s => s.isCompleted).length;
  await db.update(learningRoadmaps).set({ completedStages: completed }).where(eq(learningRoadmaps.id, roadmapId));
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────
export async function saveLinkedinAnalysis(data: Omit<LinkedinAnalysis, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(linkedinAnalyses).values(data);
  return { id: (result as any)[0]?.insertId ?? (result as any).insertId as number };
}

export async function getLinkedinAnalyses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(linkedinAnalyses).where(eq(linkedinAnalyses.userId, userId)).orderBy(desc(linkedinAnalyses.createdAt));
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getNotificationSettings(userId: number): Promise<NotificationSetting | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertNotificationSettings(data: { userId: number; isEnabled: boolean; scheduleCronTaskUid?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notificationSettings).values(data).onDuplicateKeyUpdate({ set: data });
}

export async function saveWeeklyNotification(data: { userId: number; title: string; content: string; scheduleCronTaskUid?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(weeklyNotifications).values(data);
}

export async function getWeeklyNotifications(userId: number): Promise<WeeklyNotification[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weeklyNotifications).where(eq(weeklyNotifications.userId, userId)).orderBy(desc(weeklyNotifications.createdAt)).limit(50);
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(weeklyNotifications).set({ isRead: true }).where(and(eq(weeklyNotifications.id, id), eq(weeklyNotifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(weeklyNotifications).set({ isRead: true }).where(eq(weeklyNotifications.userId, userId));
}

export async function getUsersByNotificationTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return [];
  const settings = await db.select().from(notificationSettings).where(eq(notificationSettings.scheduleCronTaskUid, taskUid));
  if (settings.length === 0) return [];
  const userIds = settings.map(s => s.userId);
  const allUsers = await db.select().from(users);
  return allUsers.filter(u => userIds.includes(u.id));
}
