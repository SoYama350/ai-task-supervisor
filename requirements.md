# AI Task Supervisor — Requirements

**Version:** 1.0.0-MVP
**Date:** 2026-02-24
**Status:** Approved for Development

---

## 1. Vision

AI Task Supervisor is an intelligent workflow orchestrator that transforms messy to-do lists into a prioritized, actionable daily plan using Large Language Models. It targets knowledge workers, solopreneurs, and startup teams who need clarity and execution speed.

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-01 | User | Type a messy sentence describing a task | The AI extracts a clean task, deadline, and priority automatically |
| US-02 | User | See my tasks organized into the Eisenhower Matrix | I immediately know what to work on first |
| US-03 | User | Click "Actionable Suggestions" on any task | I get AI-generated next steps (email drafts, code snippets, etc.) |
| US-04 | User | See a "Daily Workflow Optimizer" view | I have an ordered execution plan for today |
| US-05 | User | Sign in securely | My tasks are private and synced across devices |
| US-06 | User | Be prompted for feedback after productive sessions | The team knows if I'm satisfied |
| US-07 | Admin | Toggle AI features on/off | I can control costs during traffic spikes |
| US-08 | Admin | See token consumption and user counts | I can monitor operating costs |
| US-09 | Admin | Set per-user AI quotas | No single user can drain the AI budget |
| US-10 | Owner | See a 90-day sustainability report | I know if the product is profitable |

---

## 3. Functional Requirements

### 3.1 Authentication
- Email/password login and signup via Supabase Auth (GoTrue)
- Session persistence via HTTP-only cookies (SSR-safe)
- Protected routes: `/dashboard`, `/admin`

### 3.2 NLP Task Input
- User types a natural language task (e.g., "email Sarah about the Q3 report tomorrow")
- AI extracts: `title`, `description`, `deadline`, `urgency` (1-10), `importance` (1-10)
- Task is saved to Supabase with computed Eisenhower quadrant

### 3.3 Eisenhower Matrix
- **Quadrant 1 (Do Now):** High urgency + High importance
- **Quadrant 2 (Schedule):** Low urgency + High importance
- **Quadrant 3 (Delegate):** High urgency + Low importance
- **Quadrant 4 (Eliminate):** Low urgency + Low importance
- Algorithm: `urgency >= 6 AND importance >= 6 → Q1`, `urgency < 6 AND importance >= 6 → Q2`, etc.

### 3.4 Daily Workflow Optimizer
- AI sorts Q1 tasks by deadline proximity and estimated effort
- Produces an ordered list with time estimates
- Refreshes on demand or on dashboard load

### 3.5 Actionable Suggestions
- Feature-flagged (`ai_execution_suggestions`)
- Per-task AI call returning 3-5 concrete next steps
- Results cached in `ai_insights` table for 24 hours

### 3.6 Admin Dashboard (`/admin?secret=<ADMIN_SECRET>`)
- User table: view quota, reset, ban
- Token consumption chart (recharts) — last 30 days
- Feature flag toggles (real-time DB updates)
- One-click data export (tasks + insights as CSV/JSON zip)

### 3.7 CSAT Micro-Survey
- Triggered after user creates their 5th task in a session (or weekly prompt)
- 1-5 star rating + optional comment
- Stored in `csat_responses`; aggregate score shown in admin

### 3.8 Sustainability Monitor (90-Day Kill-Switch)
- Daily cron job reads `sustainability_metrics`
- Condition: if `(revenue + projected_growth) < operating_cost` at day 90
- Action: enables `project_sunset` feature flag → dashboard shows alert
- Owner can trigger one-click full data export

---

## 4. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load (LCP) | < 2.5s on 3G |
| AI response time | < 4s for suggestions |
| Uptime | 99.5% (Vercel SLA) |
| Auth token refresh | Automatic via Supabase SSR |
| Data encryption | At rest (Supabase default) + in transit (TLS) |
| GDPR compliance | Data export on request, account deletion |

---

## 5. Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ App Router, TypeScript |
| Styling | Tailwind CSS + Shadcn UI + Framer Motion |
| Backend | Next.js API Routes (Node.js 18+) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase GoTrue |
| AI | Vercel AI SDK + OpenAI (gpt-4o-mini default) |
| Analytics | PostHog (free tier) |
| Testing | Vitest + Testing Library |
| Deployment | Vercel (free tier → pro as needed) |
| Cron | Vercel Cron Jobs |

---

## 6. Database Schema Summary

- **users** — profile + quota fields
- **tasks** — raw_input, title, deadline, urgency, importance, quadrant, status
- **ai_insights** — cached AI responses with token counts
- **usage_logs** — daily per-user aggregates
- **feature_flags** — admin-controlled feature toggles
- **csat_responses** — satisfaction scores
- **sustainability_metrics** — daily revenue/cost recording

---

## 7. 90-Day Business Success Criteria

| Metric | Target (Day 90) |
|---|---|
| Monthly Active Users | ≥ 100 |
| Avg CSAT Score | ≥ 4.0 / 5.0 |
| Task completion rate | ≥ 60% |
| Revenue | ≥ Operating Cost |
| AI cost per user/month | ≤ $0.50 |

If all criteria are **not met** by Day 90, the Sustainability Monitor triggers the project sunset flow.

---

## 8. Out of Scope (v1)

- Native mobile app
- Team/collaboration features
- Calendar sync (Google Calendar, Outlook)
- Payment processing
- Custom AI model fine-tuning
