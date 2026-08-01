# Daily Coding Challenges

Next.js app that assigns a shared daily coding challenge by language, grades submissions against generated test cases, and runs user code in an isolated execution service.

## Architecture

- **Next.js** (`app/`) serves the UI and challenge/submit APIs. Challenges are generated with OpenAI (or a fixture in mock mode) and stored in Postgres via Prisma.
- **Code execution server** (`code-execution-server/`) accepts a single `{ language, code, input? }` request or a batch `{ language, cases }` request and returns execution output.
  - `EXECUTION_MODE=docker` builds cached language images and runs each submission in a container.
  - `EXECUTION_MODE=mock` runs JavaScript/TypeScript in-process (via `vm` + TypeScript transpile) and Python via `python3`. Use this when Docker is unavailable.

Submission flow:

1. `POST /api/challenge/submit` wraps the required `solution` function with each test input.
2. Next.js sends all wrapped cases to `CODE_EXECUTION_URL/execute` in one batch, with single-request fallback for an older executor.
3. Stdout is compared to the expected output (JSON-aware).

GPT may return array/number test values. Those are coerced to strings at the API boundary (`lib/testCases.ts`) before Prisma storage.

`Challenge` is unique by `(date, languageSlug)`. `Assignment` links each user to one challenge for a date, so users with the same preferred language share challenge and test-case rows while submissions remain user-owned.

## Quick start (mock mode, no Docker / no OpenAI / no Clerk)

```bash
cp .env.example .env.local

# Postgres only (credentials match .env.example DATABASE_URL)
npm run db:up

npm install
cd code-execution-server && npm install && cd ..

DATABASE_URL="postgresql://daily_coding_challenge:daily_coding_challenge@localhost:5432/daily_coding_challenge" npx prisma db push

# terminal 1
cd code-execution-server && EXECUTION_MODE=mock npm run dev

# terminal 2
npm run dev
```

Stop Postgres with `npm run db:down`.

Open http://localhost:3000/challenges. Mock mode seeds a user automatically and serves the fixture "Sum Array Elements" challenge.

Set `APP_MODE=mock`, `NEXT_PUBLIC_APP_MODE=mock`, and `EXECUTION_MODE=mock` (see `.env.example`). The public flag makes client components skip Clerk hooks; the executor flag selects its no-Docker backend. In this mode Next.js defaults to `http://localhost:5000` when `CODE_EXECUTION_URL` is omitted. Compose still sets the service URL explicitly.

Verify the executor alone:

```bash
npm run verify:mock
```

TypeScript is pinned to **5.9.3**. TypeScript 7 removed the classic `transpileModule` API and breaks `ts-node` / current `eslint-config-next` peers, so 5.9.3 is the newest release that keeps mock execution and tooling working.

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
| `APP_MODE` | `mock` bypasses Clerk on the server and seeds a local user |
| `NEXT_PUBLIC_APP_MODE` | `mock` makes client components skip Clerk hooks |
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
