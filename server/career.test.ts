import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { COOKIE_NAME } from "../shared/const";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserProfile: vi.fn().mockResolvedValue(null),
  upsertUserProfile: vi.fn().mockResolvedValue(undefined),
  getChatSessions: vi.fn().mockResolvedValue([]),
  createChatSession: vi.fn().mockResolvedValue({ sessionId: 1 }),
  getChatMessages: vi.fn().mockResolvedValue([]),
  saveChatMessage: vi.fn().mockResolvedValue(undefined),
  getCareerPaths: vi.fn().mockResolvedValue([]),
  saveCareerPath: vi.fn().mockResolvedValue({ pathId: 1 }),
  getRoadmaps: vi.fn().mockResolvedValue([]),
  getRoadmapWithStages: vi.fn().mockResolvedValue(null),
  createRoadmap: vi.fn().mockResolvedValue({ roadmapId: 1 }),
  insertRoadmapStages: vi.fn().mockResolvedValue(undefined),
  markStageComplete: vi.fn().mockResolvedValue(undefined),
  getCvDocuments: vi.fn().mockResolvedValue([]),
  saveCvAnalysis: vi.fn().mockResolvedValue({ cvId: 1 }),
  getInterviewSessions: vi.fn().mockResolvedValue([]),
  createInterviewSession: vi.fn().mockResolvedValue({ sessionId: 1 }),
  getInterviewQuestions: vi.fn().mockResolvedValue([]),
  saveInterviewQuestion: vi.fn().mockResolvedValue({ questionId: 1 }),
  updateInterviewAnswer: vi.fn().mockResolvedValue(undefined),
  completeInterviewSession: vi.fn().mockResolvedValue(undefined),
  getLinkedinAnalyses: vi.fn().mockResolvedValue([]),
  saveLinkedinAnalysis: vi.fn().mockResolvedValue({ analysisId: 1 }),
  getWeeklyNotifications: vi.fn().mockResolvedValue([]),
  getNotificationSettings: vi.fn().mockResolvedValue(null),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
  upsertNotificationSettings: vi.fn().mockResolvedValue(undefined),
  getUsersByNotificationTaskUid: vi.fn().mockResolvedValue([]),
  saveWeeklyNotification: vi.fn().mockResolvedValue(undefined),
  getDashboardStats: vi.fn().mockResolvedValue({
    chatSessions: 0,
    careerPaths: 0,
    cvAnalyses: 0,
    roadmaps: 0,
    interviewSessions: 0,
    linkedinAnalyses: 0,
  }),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ title: "Test", content: "Test content" }) } }],
  }),
}));

// ─── Mock heartbeat ───────────────────────────────────────────────────────────
vi.mock("./_core/heartbeat", () => ({
  createHeartbeatJob: vi.fn().mockResolvedValue({ taskUid: "test-uid-123", nextExecutionAt: null }),
  deleteHeartbeatJob: vi.fn().mockResolvedValue(undefined),
}));

// ─── Helper ───────────────────────────────────────────────────────────────────
function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-open-id",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { cookie: `${COOKIE_NAME}=test-session-token` },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = createAuthContext();
    const clearedCookies: string[] = [];
    ctx.res.clearCookie = (name: string) => { clearedCookies.push(name); };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies).toContain(COOKIE_NAME);
  });
});

describe("auth.me", () => {
  it("returns the authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.email).toBe("test@example.com");
    expect(user?.name).toBe("Test User");
  });
});

describe("profile", () => {
  it("get returns null when no profile exists", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const profile = await caller.profile.get();
    expect(profile).toBeNull();
  });

  it("update returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.update({
      currentRole: "Software Engineer",
      targetRole: "ML Engineer",
      skills: ["Python", "SQL"],
      yearsOfExperience: 3,
    });
    expect(result.success).toBe(true);
  });
});

describe("chat", () => {
  it("getSessions returns empty array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const sessions = await caller.chat.getSessions();
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBe(0);
  });

  it("createSession returns a session id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.createSession({ title: "Test Session" });
    expect(result).toHaveProperty("sessionId");
  });
});

describe("dashboard", () => {
  it("getStats returns stats object with all expected fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.getStats();
    expect(stats).toHaveProperty("chatSessions");
    expect(stats).toHaveProperty("careerPaths");
    expect(stats).toHaveProperty("cvAnalyses");
    expect(stats).toHaveProperty("roadmaps");
    expect(stats).toHaveProperty("interviewSessions");
    expect(stats).toHaveProperty("linkedinAnalyses");
  });
});

describe("roadmap", () => {
  it("getAll returns empty array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const roadmaps = await caller.roadmap.getAll();
    expect(Array.isArray(roadmaps)).toBe(true);
  });
});

describe("notifications", () => {
  it("getAll returns empty array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const notifs = await caller.notifications.getAll();
    expect(Array.isArray(notifs)).toBe(true);
  });

  it("getSettings returns null when no settings", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const settings = await caller.notifications.getSettings();
    expect(settings).toBeNull();
  });

  it("markAllRead returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.markAllRead();
    expect(result.success).toBe(true);
  });
});

describe("careerPaths", () => {
  it("getAll returns empty array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const paths = await caller.careerPaths.getAll();
    expect(Array.isArray(paths)).toBe(true);
  });
});

describe("linkedin", () => {
  it("getAnalyses returns empty array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const analyses = await caller.linkedin.getAnalyses();
    expect(Array.isArray(analyses)).toBe(true);
  });
});
