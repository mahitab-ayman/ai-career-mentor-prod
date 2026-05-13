import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { parse as parseCookie } from "cookie";
import { createHeartbeatJob, deleteHeartbeatJob } from "./_core/heartbeat";
import * as db from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildSystemPrompt(profile: Awaited<ReturnType<typeof db.getUserProfile>>, userName?: string | null) {
  return `You are "CareerMentor AI", a warm, professional, and empowering career advisor specializing in helping women thrive in technology careers. You provide personalized, actionable, and encouraging guidance.

${profile ? `User Profile:
- Name: ${userName || "there"}
- Current Role: ${profile.currentRole || "Not specified"}
- Target Role: ${profile.targetRole || "Not specified"}
- Skills: ${(profile.skills as string[])?.join(", ") || "Not specified"}
- Career Goals: ${profile.careerGoals || "Not specified"}
- Years of Experience: ${profile.yearsOfExperience || 0}
- Industry: ${profile.industry || "Technology"}
- Education: ${profile.education || "Not specified"}` : `User: ${userName || "there"}`}

Guidelines:
- Always respond in English with a warm, professional, and encouraging tone
- Be specific, practical, and actionable in your advice
- Use Markdown formatting (headings, bullet points, bold) for clarity
- Acknowledge challenges women face in tech and provide empowering solutions
- Reference the user's profile when relevant to personalize advice`;
}

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Profile ───────────────────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProfile(ctx.user.id);
    }),
    update: protectedProcedure.input(z.object({
      currentRole: z.string().optional(),
      targetRole: z.string().optional(),
      skills: z.array(z.string()).optional(),
      yearsOfExperience: z.number().optional(),
      industry: z.string().optional(),
      education: z.string().optional(),
      bio: z.string().optional(),
      careerGoals: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.upsertUserProfile({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
  }),

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return db.getDashboardStats(ctx.user.id);
    }),
  }),

  // ─── Chat ──────────────────────────────────────────────────────────────────
  chat: router({
    getSessions: protectedProcedure.query(async ({ ctx }) => {
      return db.getChatSessions(ctx.user.id);
    }),
    createSession: protectedProcedure.mutation(async ({ ctx }) => {
      return db.createChatSession(ctx.user.id);
    }),
    deleteSession: protectedProcedure.input(z.object({ sessionId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteChatSession(input.sessionId, ctx.user.id);
      return { success: true };
    }),
    getMessages: protectedProcedure.input(z.object({ sessionId: z.number() })).query(async ({ ctx, input }) => {
      return db.getChatMessages(input.sessionId, ctx.user.id);
    }),
    sendMessage: protectedProcedure.input(z.object({
      sessionId: z.number(),
      message: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const [profile, history] = await Promise.all([
        db.getUserProfile(ctx.user.id),
        db.getChatMessages(input.sessionId, ctx.user.id),
      ]);
      await db.saveChatMessage({ sessionId: input.sessionId, userId: ctx.user.id, role: "user", content: input.message });
      const systemPrompt = buildSystemPrompt(profile, ctx.user.name);
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...history.slice(-12).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: input.message },
      ];
      const response = await invokeLLM({ messages });
      const rawContent = response.choices[0]?.message?.content;
      const aiContent = typeof rawContent === "string" ? rawContent : "Sorry, I encountered an error. Please try again.";
      await db.saveChatMessage({ sessionId: input.sessionId, userId: ctx.user.id, role: "assistant", content: aiContent });
      // Auto-title from first message
      if (history.length === 0) {
        const titleRes = await invokeLLM({
          messages: [
            { role: "system", content: "Create a very short title (3-5 words) for this career conversation. Return only the title." },
            { role: "user", content: input.message },
          ]
        });
        const rawTitle = titleRes.choices[0]?.message?.content;
        const title = typeof rawTitle === "string" ? rawTitle.trim().substring(0, 60) : "Career Conversation";
        await db.updateChatSessionTitle(input.sessionId, title);
      }
      return { content: aiContent };
    }),
  }),

  // ─── Career Paths ──────────────────────────────────────────────────────────
  careerPaths: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return db.getCareerPaths(ctx.user.id);
    }),
    generate: protectedProcedure.input(z.object({
      interests: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const profile = await db.getUserProfile(ctx.user.id);
      const prompt = `Based on this user's profile, generate 4 personalized career path recommendations for women in tech.

Profile:
- Current Role: ${profile?.currentRole || "Not specified"}
- Target Role: ${profile?.targetRole || "Not specified"}
- Skills: ${(profile?.skills as string[])?.join(", ") || "Not specified"}
- Years of Experience: ${profile?.yearsOfExperience || 0}
- Industry: ${profile?.industry || "Technology"}
- Career Goals: ${profile?.careerGoals || "Not specified"}
${input.interests ? `- Additional Interests: ${input.interests}` : ""}

Return a JSON array of exactly 4 career paths. Each path must have:
{
  "pathTitle": "string (e.g., 'Data Science Lead')",
  "description": "string (2-3 sentences about this path)",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "timelineMonths": number (6-36),
  "salaryRange": "string (e.g., '$90K - $140K')",
  "matchScore": number (60-99),
  "resources": [{"title": "string", "url": "https://...", "type": "course|book|platform"}]
}`;
      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_schema", json_schema: { name: "career_paths", strict: true, schema: { type: "object", properties: { paths: { type: "array", items: { type: "object", properties: { pathTitle: { type: "string" }, description: { type: "string" }, skills: { type: "array", items: { type: "string" } }, timelineMonths: { type: "number" }, salaryRange: { type: "string" }, matchScore: { type: "number" }, resources: { type: "array", items: { type: "object", properties: { title: { type: "string" }, url: { type: "string" }, type: { type: "string" } }, required: ["title", "url", "type"], additionalProperties: false } } }, required: ["pathTitle", "description", "skills", "timelineMonths", "salaryRange", "matchScore", "resources"], additionalProperties: false } } }, required: ["paths"], additionalProperties: false } } },
      });
      const raw = response.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof raw === "string" ? raw : "{}");
      const paths = parsed.paths || [];
      const saved = [];
      for (const p of paths) {
        const { id } = await db.saveCareerPath({ userId: ctx.user.id, ...p, isSaved: false });
        saved.push({ id, ...p });
      }
      return saved;
    }),
    toggleSave: protectedProcedure.input(z.object({ id: z.number(), isSaved: z.boolean() })).mutation(async ({ ctx, input }) => {
      await db.toggleSaveCareerPath(input.id, ctx.user.id, input.isSaved);
      return { success: true };
    }),
  }),

  // ─── CV Analysis ───────────────────────────────────────────────────────────
  cv: router({
    getAnalyses: protectedProcedure.query(async ({ ctx }) => {
      return db.getCvAnalyses(ctx.user.id);
    }),
    upload: protectedProcedure.input(z.object({
      filename: z.string(),
      fileBase64: z.string(),
      mimeType: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `cv-${ctx.user.id}-${Date.now()}-${input.filename}`;
      const { key, url } = await storagePut(fileKey, buffer, input.mimeType);
      const { id: documentId } = await db.saveCvDocument({ userId: ctx.user.id, filename: input.filename, fileKey: key, fileUrl: url, mimeType: input.mimeType });
      // Analyze with LLM
      const profile = await db.getUserProfile(ctx.user.id);
      const cvText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n]/g, " ").substring(0, 8000);
      const prompt = `Analyze this CV/resume for a woman in tech. Provide detailed, actionable feedback.

CV Content:
${cvText}

User Profile:
- Target Role: ${profile?.targetRole || "Not specified"}
- Industry: ${profile?.industry || "Technology"}

Return JSON with:
{
  "overallScore": number (0-100),
  "atsScore": number (0-100, ATS compatibility),
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "keySkills": ["skill1", "skill2", "skill3"],
  "suggestions": "Detailed paragraph with specific actionable suggestions",
  "fullAnalysis": "Comprehensive markdown analysis with sections for Summary, Strengths, Areas for Improvement, ATS Optimization, and Next Steps"
}`;
      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_schema", json_schema: { name: "cv_analysis", strict: true, schema: { type: "object", properties: { overallScore: { type: "number" }, atsScore: { type: "number" }, strengths: { type: "array", items: { type: "string" } }, improvements: { type: "array", items: { type: "string" } }, keySkills: { type: "array", items: { type: "string" } }, suggestions: { type: "string" }, fullAnalysis: { type: "string" } }, required: ["overallScore", "atsScore", "strengths", "improvements", "keySkills", "suggestions", "fullAnalysis"], additionalProperties: false } } },
      });
      const raw = response.choices[0]?.message?.content;
      const analysis = JSON.parse(typeof raw === "string" ? raw : "{}");
      const { id: analysisId } = await db.saveCvAnalysis({ userId: ctx.user.id, documentId, ...analysis });
      return { analysisId, documentId, ...analysis };
    }),
  }),

  // ─── Interview Simulation ──────────────────────────────────────────────────
  interview: router({
    getSessions: protectedProcedure.query(async ({ ctx }) => {
      return db.getInterviewSessions(ctx.user.id);
    }),
    createSession: protectedProcedure.input(z.object({
      jobRole: z.string().min(1),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
      totalQuestions: z.number().min(3).max(10).default(5),
    })).mutation(async ({ ctx, input }) => {
      return db.createInterviewSession({ userId: ctx.user.id, ...input, status: "active" });
    }),
    generateQuestion: protectedProcedure.input(z.object({
      sessionId: z.number(),
      jobRole: z.string(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
      questionNumber: z.number(),
      previousQA: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    })).mutation(async ({ ctx, input }) => {
      const difficultyMap = { beginner: "entry-level, general", intermediate: "mid-level, technical and behavioral", advanced: "senior-level, in-depth and case-based" };
      const prevContext = input.previousQA?.length ? `\nPrevious Q&A:\n${input.previousQA.map((qa, i) => `Q${i + 1}: ${qa.question}\nA: ${qa.answer}`).join("\n")}` : "";
      const prompt = `Generate interview question #${input.questionNumber} for a ${input.jobRole} position.
Difficulty: ${difficultyMap[input.difficulty]}
${prevContext}
Return JSON: { "question": "the interview question" }
Make it specific, realistic, and appropriate for the difficulty level. Avoid repeating previous questions.`;
      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_schema", json_schema: { name: "question", strict: true, schema: { type: "object", properties: { question: { type: "string" } }, required: ["question"], additionalProperties: false } } },
      });
      const raw = response.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof raw === "string" ? raw : '{"question":"Tell me about yourself."}');
      return { question: parsed.question };
    }),
    submitAnswer: protectedProcedure.input(z.object({
      sessionId: z.number(),
      questionNumber: z.number(),
      question: z.string(),
      answer: z.string(),
      jobRole: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const prompt = `Evaluate this interview answer for a ${input.jobRole} position.

Question: ${input.question}
Answer: ${input.answer}

Return JSON:
{
  "score": number (0-100),
  "feedback": "Detailed feedback paragraph",
  "strengths": "What was done well",
  "improvements": "What could be improved"
}`;
      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_schema", json_schema: { name: "answer_score", strict: true, schema: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" }, strengths: { type: "string" }, improvements: { type: "string" } }, required: ["score", "feedback", "strengths", "improvements"], additionalProperties: false } } },
      });
      const raw = response.choices[0]?.message?.content;
      const result = JSON.parse(typeof raw === "string" ? raw : "{}");
      await db.saveInterviewQA({ sessionId: input.sessionId, questionNumber: input.questionNumber, question: input.question, answer: input.answer, ...result });
      return result;
    }),
    completeSession: protectedProcedure.input(z.object({ sessionId: z.number() })).mutation(async ({ ctx, input }) => {
      const qas = await db.getInterviewQA(input.sessionId);
      const avgScore = qas.length > 0 ? Math.round(qas.reduce((sum, qa) => sum + (qa.score || 0), 0) / qas.length) : 0;
      const prompt = `Provide an overall interview performance summary.
Job Role: (from session)
Questions answered: ${qas.length}
Average Score: ${avgScore}/100
Individual scores: ${qas.map((qa, i) => `Q${i + 1}: ${qa.score}/100`).join(", ")}

Return JSON: { "overallScore": ${avgScore}, "feedback": "Comprehensive performance summary with specific strengths, areas for improvement, and actionable next steps for the candidate" }`;
      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_schema", json_schema: { name: "overall_result", strict: true, schema: { type: "object", properties: { overallScore: { type: "number" }, feedback: { type: "string" } }, required: ["overallScore", "feedback"], additionalProperties: false } } },
      });
      const raw = response.choices[0]?.message?.content;
      const result = JSON.parse(typeof raw === "string" ? raw : `{"overallScore":${avgScore},"feedback":"Interview completed."}`);
      await db.completeInterviewSession(input.sessionId, result.overallScore, result.feedback);
      return result;
    }),
  }),

  // ─── Learning Roadmap ──────────────────────────────────────────────────────
  roadmap: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return db.getRoadmaps(ctx.user.id);
    }),
    getOne: protectedProcedure.input(z.object({ roadmapId: z.number() })).query(async ({ ctx, input }) => {
      return db.getRoadmapWithStages(input.roadmapId, ctx.user.id);
    }),
    generate: protectedProcedure.input(z.object({
      targetRole: z.string().min(1),
      currentLevel: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const profile = await db.getUserProfile(ctx.user.id);
      const prompt = `Create a personalized learning roadmap for someone aiming to become a ${input.targetRole}.

Current Profile:
- Current Role: ${profile?.currentRole || input.currentLevel || "Beginner"}
- Skills: ${(profile?.skills as string[])?.join(", ") || "Not specified"}
- Years of Experience: ${profile?.yearsOfExperience || 0}

Generate a roadmap with 5-7 stages. Return JSON:
{
  "title": "Roadmap to ${input.targetRole}",
  "stages": [
    {
      "stageNumber": 1,
      "title": "Stage title",
      "description": "What to learn and why",
      "skills": ["skill1", "skill2"],
      "resources": [{"title": "Resource name", "url": "https://...", "type": "course|book|platform|community"}],
      "estimatedWeeks": number
    }
  ]
}`;
      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_schema", json_schema: { name: "roadmap", strict: true, schema: { type: "object", properties: { title: { type: "string" }, stages: { type: "array", items: { type: "object", properties: { stageNumber: { type: "number" }, title: { type: "string" }, description: { type: "string" }, skills: { type: "array", items: { type: "string" } }, resources: { type: "array", items: { type: "object", properties: { title: { type: "string" }, url: { type: "string" }, type: { type: "string" } }, required: ["title", "url", "type"], additionalProperties: false } }, estimatedWeeks: { type: "number" } }, required: ["stageNumber", "title", "description", "skills", "resources", "estimatedWeeks"], additionalProperties: false } } }, required: ["title", "stages"], additionalProperties: false } } },
      });
      const raw = response.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof raw === "string" ? raw : "{}");
      const { roadmapId } = await db.createRoadmap({ userId: ctx.user.id, title: parsed.title, targetRole: input.targetRole, totalStages: parsed.stages?.length || 0 });
      const stages = (parsed.stages || []).map((s: any) => ({ roadmapId, ...s, isCompleted: false }));
      await db.saveRoadmapStages(stages);
      return { roadmapId, title: parsed.title, stages };
    }),
    markStageComplete: protectedProcedure.input(z.object({ stageId: z.number(), roadmapId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.markStageComplete(input.stageId, input.roadmapId);
      return { success: true };
    }),
  }),

  // ─── LinkedIn Analysis ─────────────────────────────────────────────────────
  linkedin: router({
    getAnalyses: protectedProcedure.query(async ({ ctx }) => {
      return db.getLinkedinAnalyses(ctx.user.id);
    }),
    analyze: protectedProcedure.input(z.object({
      profileText: z.string().min(50),
    })).mutation(async ({ ctx, input }) => {
      const profile = await db.getUserProfile(ctx.user.id);
      const prompt = `Analyze this LinkedIn profile for a woman in tech and provide detailed optimization suggestions.

Profile Text:
${input.profileText.substring(0, 5000)}

Target Role: ${profile?.targetRole || "Not specified"}

Return JSON:
{
  "overallScore": number (0-100),
  "headlineSuggestion": "Improved headline suggestion with explanation",
  "summarySuggestion": "Improved About section suggestion",
  "skillsSuggestion": "Skills section recommendations",
  "fullAnalysis": "Comprehensive markdown analysis covering: Profile Strength Score, Headline Analysis, About Section, Experience Section, Skills & Endorsements, Recommendations, Visibility Tips, and Keyword Optimization for recruiters"
}`;
      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_schema", json_schema: { name: "linkedin_analysis", strict: true, schema: { type: "object", properties: { overallScore: { type: "number" }, headlineSuggestion: { type: "string" }, summarySuggestion: { type: "string" }, skillsSuggestion: { type: "string" }, fullAnalysis: { type: "string" } }, required: ["overallScore", "headlineSuggestion", "summarySuggestion", "skillsSuggestion", "fullAnalysis"], additionalProperties: false } } },
      });
      const raw = response.choices[0]?.message?.content;
      const result = JSON.parse(typeof raw === "string" ? raw : "{}");
      await db.saveLinkedinAnalysis({ userId: ctx.user.id, profileText: input.profileText, ...result });
      return result;
    }),
  }),

  // ─── Notifications ─────────────────────────────────────────────────────────
  notifications: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotificationSettings(ctx.user.id);
    }),
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return db.getWeeklyNotifications(ctx.user.id);
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.markNotificationRead(input.id, ctx.user.id);
      return { success: true };
    }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
    enableWeekly: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await db.getNotificationSettings(ctx.user.id);
      if (existing?.isEnabled && existing.scheduleCronTaskUid) {
        return { success: true, message: "Weekly notifications already enabled" };
      }
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const job = await createHeartbeatJob({
        name: `weekly-career-tips-${ctx.user.id}`,
        cron: "0 0 9 * * 1",
        path: "/api/scheduled/weekly-notifications",
        payload: { userId: ctx.user.id },
        description: `Weekly career tips for user ${ctx.user.id}`,
      }, sessionToken);
      await db.upsertNotificationSettings({ userId: ctx.user.id, isEnabled: true, scheduleCronTaskUid: job.taskUid });
      return { success: true, nextExecutionAt: job.nextExecutionAt };
    }),
    disableWeekly: protectedProcedure.mutation(async ({ ctx }) => {
      const settings = await db.getNotificationSettings(ctx.user.id);
      if (!settings?.scheduleCronTaskUid) {
        await db.upsertNotificationSettings({ userId: ctx.user.id, isEnabled: false, scheduleCronTaskUid: null });
        return { success: true };
      }
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      try {
        await deleteHeartbeatJob(settings.scheduleCronTaskUid, sessionToken);
      } catch (e) {
        console.warn("Failed to delete heartbeat job:", e);
      }
      await db.upsertNotificationSettings({ userId: ctx.user.id, isEnabled: false, scheduleCronTaskUid: null });
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
