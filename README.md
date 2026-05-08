# AI Task Supervisor

AI Task Supervisor is an intelligent workflow orchestrator that transforms messy to-do lists into a prioritized, actionable daily plan using Large Language Models.

## Local Setup

Follow these steps to run the project locally:

### 1. Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account and project
- An OpenAI API key

### 2. Installation

Clone the repository and install dependencies:

```bash
npm install
```

### 3. Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your:
- Supabase URL and keys
- OpenAI API Key
- PostHog keys (optional)
- Admin secret

### 4. Database Setup

Apply the migrations to your Supabase project:
Migrations are located in `supabase/migrations/`. You can run them manually in the Supabase SQL editor.

### 5. Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 6. Building for Production

To build the application:

```bash
npm run build
```

## Features

- **NLP Task Input**: Type natural language tasks and have them parsed automatically.
- **Eisenhower Matrix**: Tasks are categorized into four quadrants based on urgency and importance.
- **Daily Optimizer**: AI-driven daily plan generation.
- **Actionable Suggestions**: Get concrete next steps for any task.
- **Admin Dashboard**: Monitor usage and manage feature flags.

## Testing

Run tests with Vitest:

```bash
npm test
```
