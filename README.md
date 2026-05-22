# Running AI Task Supervisor Locally

Follow these steps to set up and run the project on your local machine.

## Prerequisites

- **Node.js**: Version 18 or higher.
- **npm**: Version 9 or higher.
- **Supabase Account**: You'll need a Supabase project for authentication and the database.
- **OpenAI API Key**: Required for AI-powered features.

## Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd ai-task-supervisor
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment variables**:
    Copy the example environment file and fill in your values.
    ```bash
    cp .env.example .env.local
    ```
    Edit `.env.local` and provide:
    - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key.
    - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations).
    - `OPENAI_API_KEY`: Your OpenAI API key.
    - `ADMIN_SECRET`: A secure string for accessing the admin dashboard.

4.  **Database Migration**:
    Apply the initial schema to your Supabase project using the SQL editor in the Supabase dashboard with the content of `supabase/migrations/001_initial_schema.sql`.

## Running the Application

1.  **Development mode**:
    ```bash
    npm run dev
    ```
    The app will be available at [http://localhost:3000](http://localhost:3000).

2.  **Build for production**:
    ```bash
    npm run build
    npm start
    ```

## Testing

Run unit and integration tests with:
```bash
npm test
```

## Troubleshooting

- If you encounter type errors related to the AI SDK, ensure you are using the pinned versions in `package.json`.
- Ensure all environment variables are correctly set in `.env.local`.
