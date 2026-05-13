# AI Career Mentor for Women - TODO

## Database & Backend
- [x] Define full database schema (users, profiles, chat sessions/messages, career paths, roadmaps, CV docs/analyses, interview sessions/QA, linkedin analyses, notifications)
- [x] DB helper functions in server/db.ts
- [x] tRPC router: AI Career Chatbot (streaming chat, session history)
- [x] tRPC router: Career Path Recommendations (generate + save)
- [x] tRPC router: CV Analysis (upload, parse, AI analysis)
- [x] tRPC router: Interview Simulation (create session, generate questions, score answers, complete)
- [x] tRPC router: Learning Roadmap (generate, track progress)
- [x] tRPC router: LinkedIn Analysis (analyze pasted text)
- [x] tRPC router: Weekly Notifications (enable/disable schedule, list notifications)
- [x] tRPC router: User Profile (get/update)
- [x] tRPC router: Dashboard stats
- [x] Heartbeat scheduled handler for weekly notifications
- [x] Mount /api/scheduled/weekly-notifications in index.ts

## Frontend
- [x] Design system: warm professional color palette, typography, global CSS
- [x] AppLayout (sidebar navigation with all features)
- [x] Home / Landing page
- [x] Dashboard page (stats overview)
- [x] AI Career Chatbot page (streaming chat UI)
- [x] Career Paths page (recommendations + save)
- [x] CV Analysis page (upload + results)
- [x] Interview Simulation page (setup → questions → results)
- [x] Learning Roadmap page (stages + progress)
- [x] LinkedIn Analysis page (paste + results)
- [x] Notifications page (manage weekly schedule + history)
- [x] User Profile page (edit profile)
- [x] App.tsx routes wiring

## Testing & Deployment
- [x] Vitest tests for all major features (14 tests passing)
- [x] TypeScript check passes (0 errors)
- [x] Build succeeds
- [ ] Checkpoint saved
- [ ] App deployed with shareable link
