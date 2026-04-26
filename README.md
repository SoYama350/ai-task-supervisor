# AI Task Supervisor

An intelligent workflow orchestrator using LLMs to transform disorganized to-do lists into prioritized daily plans for knowledge workers and teams.

## Features

- **NLP Input**: Capture tasks using natural language.
- **Eisenhower Matrix**: Automatically categorize and prioritize tasks.
- **Actionable Suggestions**: AI-generated help for your tasks (email drafts, code snippets, etc.).
- **Admin Dashboard**: Real-time analytics and feature management.
- **Sustainability Monitoring**: Track system health and performance.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- [Supabase](https://supabase.com/) account and project
- [OpenAI API](https://openai.com/api/) key

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-task-supervisor
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (for admin functions)
- `OPENAI_API_KEY`: Your OpenAI API Key
- `ADMIN_SECRET`: A secure string for accessing the admin dashboard

### 4. Database Setup

The project uses Supabase. Ensure you have the necessary tables created. Migration files can be found in `supabase/migrations/`.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running Tests

```bash
npm test
```

## Build for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database/Auth**: [Supabase](https://supabase.com/)
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)
