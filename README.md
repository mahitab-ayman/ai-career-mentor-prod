<div align="center">
  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663217691016/k7VpytXHEM35u7EgMMjw5j/logo-main-5znZ9t9873fmEfK7YrfeAJ.png" alt="CareerMentor AI Logo" width="480" />

  <h1>CareerMentor AI — for Women in Tech</h1>

  <p><strong>An AI-powered career guidance platform designed to help women break barriers and accelerate their careers in technology.</strong></p>

  <p>
    <a href="https://aicareermentor-k7vpytxh.manus.space"><img src="https://img.shields.io/badge/Live%20Demo-Visit%20App-7C3AED?style=for-the-badge&logo=vercel" alt="Live Demo" /></a>
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/tRPC-11-2596BE?style=for-the-badge&logo=trpc" alt="tRPC" />
    <img src="https://img.shields.io/badge/Tests-14%20Passing-22C55E?style=for-the-badge&logo=vitest" alt="Tests" />
  </p>
</div>

---

## Overview

**CareerMentor AI** is a full-stack web application that combines conversational AI with structured career development tools, built specifically for women navigating careers in technology. The platform provides personalized guidance across every stage of a tech career — from discovering the right path, to preparing for interviews, to optimizing a LinkedIn profile for maximum visibility.

The application is fully functional with real AI integrations (not mock data), a persistent database, OAuth authentication, file storage, and automated weekly career tip notifications delivered every Monday morning.

---

## Features

| Feature | Description |
|---|---|
| **AI Career Chatbot** | Real-time AI conversations with full session history and markdown-rendered responses |
| **Career Path Recommendations** | AI-generated personalized career path suggestions (Data Science, AI, Product, UX, etc.) based on user profile |
| **CV Analysis** | Upload PDF or DOCX files; AI extracts text and returns an overall score, ATS score, strengths, and improvement suggestions |
| **Interview Simulation** | AI-generated questions at Beginner / Intermediate / Advanced levels with answer scoring and performance reports |
| **Personalized Learning Roadmap** | Generate a stage-by-stage learning roadmap for any target role, with progress tracking per stage |
| **LinkedIn Profile Review** | Paste your LinkedIn profile text and receive a profile score, headline suggestion, summary rewrite, and skills optimization |
| **Weekly Notifications** | Automated Monday morning career tips delivered via scheduled background tasks |
| **User Profile** | Set current role, target role, skills, years of experience, and career goals |
| **Dashboard** | Overview of all activity: saved paths, completed interviews, CV analyses, and chat sessions |

---

## Tech Stack

### Frontend
- **React 19** with TypeScript — component-based UI
- **Tailwind CSS 4** — utility-first styling with a custom warm purple/rose design system
- **shadcn/ui + Radix UI** — accessible, composable component primitives
- **Framer Motion** — smooth micro-interactions and page transitions
- **Wouter** — lightweight client-side routing
- **TanStack Query** — server state management with optimistic updates
- **Streamdown** — real-time markdown streaming for AI responses

### Backend
- **Node.js + Express 4** — HTTP server
- **tRPC 11** — end-to-end type-safe API (no REST, no manual contracts)
- **Drizzle ORM** — type-safe SQL query builder
- **MySQL / TiDB** — relational database
- **AWS S3** — file storage for CV uploads
- **pdf-parse + mammoth** — PDF and DOCX text extraction for CV analysis

### AI & Integrations
- **LLM (via Manus Forge API)** — powers all AI features: chat, career recommendations, CV feedback, interview questions, roadmap generation, LinkedIn analysis
- **Manus OAuth** — authentication and session management
- **Heartbeat Scheduled Tasks** — weekly notification cron jobs

### Testing & Tooling
- **Vitest** — unit testing (14 tests across all major features)
- **Vite 7** — fast development server and production bundler
- **ESBuild** — server-side bundling for production
- **Drizzle Kit** — database schema migrations

---

## Project Structure

```
ai-career-mentor-prod/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppLayout.tsx       # Sidebar navigation layout
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── Dashboard.tsx       # Stats overview
│   │   │   ├── Chat.tsx            # AI Career Chatbot
│   │   │   ├── CareerPaths.tsx     # Career recommendations
│   │   │   ├── CVAnalysis.tsx      # CV upload & analysis
│   │   │   ├── Interview.tsx       # Interview simulation
│   │   │   ├── Roadmap.tsx         # Learning roadmap
│   │   │   ├── LinkedIn.tsx        # LinkedIn review
│   │   │   ├── Notifications.tsx   # Notification settings
│   │   │   └── Profile.tsx         # User profile
│   │   ├── App.tsx                 # Routes
│   │   └── index.css               # Global design tokens
│   └── index.html
├── server/
│   ├── routers.ts                  # All tRPC procedures
│   ├── db.ts                       # Database query helpers
│   ├── scheduledHandlers.ts        # Weekly notification job
│   ├── storage.ts                  # S3 file storage helpers
│   ├── career.test.ts              # Feature tests
│   └── _core/                      # Auth, LLM, env, context
├── drizzle/
│   └── schema.ts                   # Database schema (14 tables)
└── shared/
    └── const.ts                    # Shared constants
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL or TiDB database
- Manus platform account (for OAuth and LLM API access)

### Installation

```bash
# Clone the repository
git clone https://github.com/mahitab-ayman/ai-career-mentor-prod.git
cd ai-career-mentor-prod

# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/dbname

# Authentication (Manus OAuth)
JWT_SECRET=your_jwt_secret
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth

# AI API (Manus Forge)
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge

# Owner info
OWNER_OPEN_ID=your_open_id
OWNER_NAME=your_name
```

### Database Setup

```bash
# Generate and apply migrations
pnpm db:push
```

### Development

```bash
# Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Production Build

```bash
# Build for production
pnpm build

# Start the production server
pnpm start
```

### Running Tests

```bash
pnpm test
```

---

## Database Schema

The application uses 14 database tables to support all features:

| Table | Purpose |
|---|---|
| `users` | User accounts and authentication |
| `userProfiles` | Career goals, skills, experience level |
| `chatSessions` | Conversation sessions |
| `chatMessages` | Individual messages per session |
| `careerPaths` | Saved career path recommendations |
| `cvAnalyses` | CV upload records and AI feedback |
| `interviewSessions` | Interview simulation sessions |
| `interviewQuestions` | Questions and answers per session |
| `learningRoadmaps` | Generated roadmap records |
| `roadmapStages` | Individual stages within a roadmap |
| `linkedinAnalyses` | LinkedIn profile review records |
| `notificationSettings` | Per-user notification preferences |
| `notifications` | Individual notification records |
| `scheduledJobs` | Background job tracking |

---

## Screenshots

| Landing Page | Dashboard | AI Chat |
|---|---|---|
| Home with feature overview | Stats and activity overview | Real-time AI conversations |

| CV Analysis | Interview Simulation | Learning Roadmap |
|---|---|---|
| Upload & AI feedback | 3-level question simulation | Stage-by-stage progress |

---

## Deployment

The application is deployed on the **Manus platform** and is live at:

**[https://aicareermentor-k7vpytxh.manus.space](https://aicareermentor-k7vpytxh.manus.space)**

The platform handles:
- Managed Node.js runtime (Cloud Run)
- Automatic HTTPS and CDN
- Managed TiDB database
- S3-compatible file storage
- OAuth authentication
- Scheduled background tasks (weekly notifications)

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and write tests
4. Run `pnpm check` to verify TypeScript types
5. Run `pnpm test` to ensure all tests pass
6. Commit your changes: `git commit -m "feat: add your feature"`
7. Push to your branch: `git push origin feature/your-feature-name`
8. Open a Pull Request

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## About

**CareerMentor AI** was built to address the unique challenges women face in technology careers — from navigating career transitions to preparing for technical interviews in male-dominated environments. The platform provides a safe, supportive, and intelligent space for women to plan, grow, and thrive in tech.

> *"Break barriers and accelerate your tech career with personalized AI guidance."*

---

<div align="center">
  <p>Built with ❤️ for women in technology</p>
  <p>
    <a href="https://aicareermentor-k7vpytxh.manus.space">Live App</a> •
    <a href="https://github.com/mahitab-ayman/ai-career-mentor-prod/issues">Report Bug</a> •
    <a href="https://github.com/mahitab-ayman/ai-career-mentor-prod/issues">Request Feature</a>
  </p>
</div>
