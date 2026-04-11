# AI Task Supervisor

AI Task Supervisor is an intelligent workflow orchestrator that transforms messy to-do lists into a prioritized, actionable daily plan using Large Language Models.

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env.local` and fill in your Supabase and OpenAI credentials.
   ```bash
   cp .env.example .env.local
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Testing

Run the automated test suite with:
```bash
npm test
```

### Building

To build the application for production:
```bash
npm run build
```
