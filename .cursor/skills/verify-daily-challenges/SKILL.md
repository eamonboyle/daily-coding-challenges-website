---
name: verify-daily-challenges
description: Drive the Daily Coding Challenges Next.js app in mock mode through the real UI. Launches an isolated verify Postgres database plus mock executor and Next.js, then doctors and browser-drives Today, onboarding, dashboard, and profile. Use when verifying this app, reproducing a UI or grading bug, proving /challenges or /dashboard behavior, or when asked to control, exercise, or screenshot Daily Code Challenge.
---

# Verify Daily Coding Challenges

Agent-facing. Read this file, then the matching file under `features/` before driving a user path.

Primary surface is the Next.js UI at the isolated mock URL. The code-execution server and Postgres are dependencies, not the thing a user touches. `npm run verify:mock` grades the fixture in-process and is not a substitute for this skill.

## Isolated stack

`DELETE /api/test/clear-data` truncates every challenge and submission in the connected database. Never point this skill at the developer database `daily_coding_challenge` or at ports 3000/5000.

Defaults:

- App `http://127.0.0.1:3010`
- Executor `http://127.0.0.1:5010`
- Chrome CDP `127.0.0.1:9322`
- Database `daily_coding_challenge_verify`

Override with `VERIFY_APP_PORT`, `VERIFY_EXECUTOR_PORT`, `VERIFY_CDP_PORT`, `VERIFY_PG_DATABASE`. If a default port is already taken by a process this run did not start, refuse. Do not kill it. Do not drive it.

One stack at a time. Two Next instances can use different ports. They must not share a database if either run will call clear-data.

## Launch

From repo root:

```bash
.cursor/skills/verify-daily-challenges/scripts/launch.sh
```

Ready when the script prints `launched http://127.0.0.1:3010` and `doctor.sh` exits 0. First Next compile of `/` can take a minute. Logs live in `/tmp/verify-daily-challenges/run/*.log`.

Launch starts Postgres only if port 5432 is down (`pg_ctlcluster` in this cloud, otherwise `npm run db:up`). It creates `daily_coding_challenge_verify` if missing, runs `prisma db push` against that database, then starts the mock executor, Next, and a dedicated Chrome with a CDP port.

Needed once per machine, not per launch: root `npm install` and `code-execution-server/npm install`.

Teardown is `scripts/cleanup.sh`. Cleanup does not stop Postgres.

## Doctor

Run this first whenever anything looks off, after launch, and after a failed drive:

```bash
.cursor/skills/verify-daily-challenges/scripts/doctor.sh
```

It checks process liveness of the PIDs in `/tmp/verify-daily-challenges/run/state.env`, Postgres on `daily_coding_challenge_verify`, `GET http://127.0.0.1:5010/health` equals `{"ok":true,"mode":"mock"}`, `GET /` contains `Daily Code Challenge` and `Mock`, and Chrome CDP `/json/version`.

Doctor hits `/`, never `/challenges` or `/api/challenge/daily`. Those call `requireUser()` and auto-create `mock_clerk_user`, which hides the onboarding form.

If doctor fails after a crash, run cleanup then launch. Do not reuse a wedged UI session. Reload `/` or relaunch Chrome rather than clicking through a broken editor.

## Drive

Harness is Playwright against the launched Chrome. Prefer role plus accessible name. There are no `data-testid` attributes in this app.

```bash
node .cursor/skills/verify-daily-challenges/scripts/browser.mjs goto /
node .cursor/skills/verify-daily-challenges/scripts/browser.mjs click --role link --name "Today"
node .cursor/skills/verify-daily-challenges/scripts/browser.mjs fill --selector "#username" --value "verifyuser"
node .cursor/skills/verify-daily-challenges/scripts/browser.mjs monaco-set --value "function solution(nums: number[]): number { return 0; }"
node .cursor/skills/verify-daily-challenges/scripts/browser.mjs click --role button --name "Run tests"
node .cursor/skills/verify-daily-challenges/scripts/browser.mjs wait-text "Wrong Answer"
node .cursor/skills/verify-daily-challenges/scripts/browser.mjs screenshot --path daily-challenge/shot.png
node .cursor/skills/verify-daily-challenges/scripts/browser.mjs snapshot --path daily-challenge/page.aria.txt
node .cursor/skills/verify-daily-challenges/scripts/browser.mjs request DELETE /api/test/clear-data
```

Relative `--path` values land under `/tmp/verify-daily-challenges/evidence/`.

Named recipe for the core loop:

```bash
node .cursor/skills/verify-daily-challenges/scripts/browser.mjs feature daily-challenge
```

Read `features/README.md`, then the feature file for the path you are proving. Driving one convenient entry point is incomplete when the map lists others.

Stable handles:

| What | Handle |
| --- | --- |
| Mock mode | text `Mock` in the header (CSS makes it look like `MOCK`) |
| Nav | `navigation` named `Primary`; links `About`, `Today`, `Dashboard` |
| Today | `/challenges`, heading `Daily challenge`, fixture title `Sum Array Elements` |
| Editor | `.monaco-editor`; set code with `monaco-set` (React state follows Monaco `setValue`) |
| Submit | button `Run tests`; busy label `Running tests…` |
| Pass | status `Accepted`, banner `Solved. Come back tomorrow for a new problem.`, label `Reference solution` |
| Fail | status `Wrong Answer`, `Case N` plus `passed`/`failed` |
| Onboarding | `/onboarding`, heading `Complete your profile`, `#username`, `#language`, `#emailAlerts`, button `Complete profile` |
| Dashboard tabs | `tab` named `Submissions` and `Profile` |
| Profile | heading `Edit profile`, `select` titled `Preferred language`, button `Save changes` |

Default mock user language is TypeScript. Fixture solutions live in `lib/mocks/fixtureChallenge.ts`.

## Evidence

Proof directory is `/tmp/verify-daily-challenges/evidence/` (`VERIFY_EVIDENCE_DIR`). Cleanup must not delete it.

Standards:

- Drive the UI a user sees. `POST /api/challenge/submit` and `GET /api/challenge/daily` are supporting checks, not the proof.
- Capture the action and the resulting state. A final `Accepted` screenshot without the earlier `Wrong Answer` does not prove the fail path.
- Side effects. After a grade, `scripts/db.sh 'SELECT status, score FROM "Submission" ORDER BY "createdAt" DESC LIMIT 5;'` must show the row. After profile save, query `"User"` for the new `preferredLanguageSlug`.
- `DELETE /api/test/clear-data` is fixture reset, not a product feature. It wipes the whole verify database, not one user.
- Mock mode is the production boundary for Clerk, OpenAI, and Docker. Do not treat `npm run verify:mock` as UI proof. Docker execution is out of scope here (no daemon in this cloud).

Every artifact names the feature id and entry point. A skipped entry point is not verified via a different path.

## Cleanup

```bash
.cursor/skills/verify-daily-challenges/scripts/cleanup.sh
```

Kills the Next, executor, and Chrome PIDs from `state.env`, then any leftover listeners on those three ports. Does not `pkill` by name. Does not stop Postgres. Does not delete evidence.

After cleanup, confirm files remain under `/tmp/verify-daily-challenges/evidence/`. Run cleanup after failed iterations too so ports are not stranded.

## Helpers

All paths are relative to repo root. Scripts are executable.

| Command | What it does |
| --- | --- |
| `scripts/launch.sh` | Idempotent isolated mock stack |
| `scripts/doctor.sh` | Read-only health. Exit 0 or 1 |
| `scripts/browser.mjs` | CDP drive. See Drive |
| `scripts/db.sh '<sql>'` | `psql` against the verify database |
| `scripts/cleanup.sh` | Tear down what launch started |

`scripts/lib.sh` is sourced by the bash helpers. Do not run it directly.

## Gotchas the next agent will hit

- Opening `/challenges` or `/dashboard` profile APIs seeds `mock_clerk_user`. To see onboarding, `request DELETE /api/test/clear-data?resetUser=1` then go to `/onboarding` without visiting those routes first.
- A prior `Accepted` submission replaces `Run tests` with the solved banner and makes the editor read-only. Clear data (without `resetUser`) before proving submit.
- Header `Clear data` is hidden in mock. The mock email is `mock@example.com`, not the admin allowlist used for that button. Use the `request DELETE` command.
- Prisma CLI ignores `.env.local`. Launch already passes `DATABASE_URL` inline. Do not `prisma db push` without it.
- `npm run lint` is broken in this repo. Ignore it. Typecheck via `npm run build` if you changed product code. This skill must not change product code.
