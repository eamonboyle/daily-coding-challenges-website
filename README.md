# Daily Coding Challenges

Next.js app that serves a daily coding challenge per user, grades submissions against generated test cases, and runs user code in an isolated execution service.

## Architecture

- **Next.js** (`app/`) serves the UI and challenge/submit APIs. Challenges are generated with OpenAI (or a fixture in mock mode) and stored in Postgres via Prisma.
- **Code execution server** (`code-execution-server/`) accepts `{ language, code }` and returns `{ stdout, stderr }`.
  - `EXECUTION_MODE=docker` builds cached language images and runs each submission in a container.
  - `EXECUTION_MODE=mock` runs JavaScript/TypeScript in-process (via `vm` + TypeScript transpile) and Python via `python3`. Use this when Docker is unavailable.

Submission flow:

1. `POST /api/challenge/submit` wraps the user function with each test input.
2. Next.js calls `CODE_EXECUTION_URL/execute`.
3. Stdout is compared to the expected output (JSON-aware).

GPT may return array/number test values. Those are coerced to strings at the API boundary (`lib/testCases.ts`) before Prisma storage.

## Quick start (mock mode, no Docker / no OpenAI / no Clerk)

```bash
cp .env.example .env.local
# ensure Postgres is running and DATABASE_URL matches

npm install
cd code-execution-server && npm install && cd ..

npx prisma db push

# terminal 1
cd code-execution-server && EXECUTION_MODE=mock npm run dev

# terminal 2
APP_MODE=mock MOCK_OPENAI=true npm run dev
```

Open http://localhost:3000/challenges. Mock mode seeds a user automatically and serves the fixture "Sum Array Elements" challenge.

Verify the executor alone:

```bash
npm run verify:mock
```

## Docker Compose (full stack)

```bash
cp .env.docker.example .env.docker
# fill OPENAI_API_KEY and Clerk keys; set EXECUTION_MODE=docker

docker compose up --build
```

Services:

| Service | Port | Role |
| --- | --- | --- |
| postgres | 5432 | Challenge / submission data |
| nextjs | 3000 | Web app |
| code-execution | 5000 | Runner (`docker.sock` mounted for language containers) |

## Environment

See `.env.example` and `.env.docker.example`.

| Variable | Meaning |
| --- | --- |
| `APP_MODE` | `mock` bypasses Clerk and seeds a local user |
| `MOCK_OPENAI` | Use fixture challenge instead of calling OpenAI |
| `EXECUTION_MODE` | `mock` or `docker` for the code-execution server |
| `CODE_EXECUTION_URL` | Base URL Next.js uses to reach the executor |
| `DATABASE_URL` | Postgres connection string |

## Scripts

| Script | Where | Purpose |
| --- | --- | --- |
| `npm run dev` | root | Next.js dev server |
| `npm run verify:mock` | root | Smoke-test test-case normalization + mock executor |
| `npm run dev` | `code-execution-server/` | Executor on port 5000 |
| `npm run up` / `down` | root | `docker compose up -d` / `down` |
