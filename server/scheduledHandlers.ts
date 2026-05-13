import { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

export async function weeklyNotificationsHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    // Find all users with this task UID
    const matchedUsers = await db.getUsersByNotificationTaskUid(user.taskUid);
    if (matchedUsers.length === 0) {
      return res.json({ ok: true, skipped: "orphan" });
    }

    for (const targetUser of matchedUsers) {
      try {
        const profile = await db.getUserProfile(targetUser.id);
        const prompt = `Generate a personalized weekly career tip for a woman in tech.

User Profile:
- Name: ${targetUser.name || "there"}
- Current Role: ${profile?.currentRole || "Not specified"}
- Target Role: ${profile?.targetRole || "Not specified"}
- Skills: ${(profile?.skills as string[])?.join(", ") || "Not specified"}
- Career Goals: ${profile?.careerGoals || "Not specified"}

Create an encouraging, actionable weekly career tip. Return JSON:
{
  "title": "Short engaging title (max 60 chars)",
  "content": "Detailed tip in markdown format with specific actions, resources, and encouragement (200-400 words)"
}`;

        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "weekly_tip",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                },
                required: ["title", "content"],
                additionalProperties: false,
              },
            },
          },
        });

        const raw = response.choices[0]?.message?.content;
        const tip = JSON.parse(typeof raw === "string" ? raw : '{"title":"Weekly Career Tip","content":"Keep pushing forward in your tech journey!"}');

        await db.saveWeeklyNotification({
          userId: targetUser.id,
          title: tip.title,
          content: tip.content,
          scheduleCronTaskUid: user.taskUid,
        });
      } catch (userErr) {
        console.error(`[WeeklyNotifications] Failed for user ${targetUser.id}:`, userErr);
      }
    }

    return res.json({ ok: true, processed: matchedUsers.length });
  } catch (error: any) {
    console.error("[WeeklyNotifications] Handler error:", error);
    return res.status(500).json({
      error: error?.message || "Unknown error",
      stack: error?.stack,
      context: { url: req.url, taskUid: "unknown" },
      timestamp: new Date().toISOString(),
    });
  }
}
