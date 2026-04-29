# AI Task Supervisor

An intelligent workflow orchestrator using LLMs to transform disorganized to-do lists into prioritized daily plans.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-task-supervisor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials, OpenAI API key, and other required variables in `.env.local`.

### Development

Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

To build the application:

```bash
npm run build
```

### Running Tests

Run the test suite:

```bash
npm test
```

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database/Auth:** Supabase
- **AI Integration:** Vercel AI SDK (OpenAI)
- **Analytics:** PostHog
- **Testing:** Vitest
