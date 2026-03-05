# AI Task Supervisor

AI Task Supervisor is an intelligent workflow orchestrator that transforms messy to-do lists into a prioritized, actionable daily plan using Large Language Models.

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd ai-task-supervisor
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy the example environment file and fill in your credentials.
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and provide values for:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `OPENAI_API_KEY`
    - Other variables as needed.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Running Tests

To run the test suite, use the following command:
```bash
npm test
```

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend:** Next.js API Routes
- **Database & Auth:** Supabase
- **AI:** Vercel AI SDK + OpenAI
- **Testing:** Vitest + React Testing Library
