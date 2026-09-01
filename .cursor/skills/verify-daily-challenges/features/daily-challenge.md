# Daily challenge

Today's challenge lets a user read the fixture problem, edit `solution` in Monaco, run tests, see per-case pass or fail, and unlock the reference solution after a perfect score.

## Sub-features

- `challenge-load` shows today's fixture on `/challenges`.
- `challenge-fail` grades a wrong `solution` as `Wrong Answer` with per-case rows.
- `challenge-pass` grades the fixture solution as `Accepted` with score `100`.
- `challenge-unlock` shows `Reference solution` and the solved banner after a pass.
- `challenge-persist` writes a `Submission` row the dashboard can reopen.

## How to get to it (user POV)

- Open `http://127.0.0.1:3010/challenges`.
- Choose `Today` in the header.
- Choose `Open today's challenge` on home or about.

## Driving it with browser.mjs

Preconditions:

- `scripts/doctor.sh` exits 0.
- Mock user may already exist. That is fine.
- No Accepted submission for today, or data was just cleared.

- **Reset grade state.** Clear challenges without deleting the user. Run `node scripts/browser.mjs request DELETE /api/test/clear-data`. Response includes `"resetUser":false`.
- **Open Today.** Run `node scripts/browser.mjs goto /challenges`. Heading `Daily challenge` appears, then `Sum Array Elements`, difficulty `easy`, and a Monaco editor. Wait until `Loading challenge` is gone.
- **Named recipe.** The rest of this path is `node scripts/browser.mjs feature daily-challenge`. It performs the reset, fail, pass, screenshots, ARIA snapshot, submit payloads, and DB proof. Prefer it over hand-rolling the same clicks.
- **Fail by hand.** Set a solution that returns `0`. Run `node scripts/browser.mjs monaco-set --value "function solution(nums: number[]): number { return 0; }"` then `node scripts/browser.mjs click --role button --name "Run tests"`. Status `Wrong Answer` appears. `Case 1` shows `failed` with `expected` and `got`.
- **Pass by hand.** Set the TypeScript fixture solution. Run `node scripts/browser.mjs monaco-set --value "function solution(nums: number[]): number { return nums.reduce((a, b) => a + b, 0); }"` then click `Run tests`. Status `Accepted`, score `100`, tests `4/4`, banner `Solved. Come back tomorrow for a new problem.`, and `Reference solution`.
- **Proof.** Screenshots `daily-challenge/02-wrong-answer.png` and `daily-challenge/03-accepted.png` plus `daily-challenge/accepted.aria.txt`. Submit POST bodies must contain the fail code then the `nums.reduce` code. `scripts/db.sh 'SELECT status, score, "passedTests", "totalTests" FROM "Submission" ORDER BY "createdAt" DESC LIMIT 5;'` shows an `Accepted` row with score 100.

## Gotchas

- Default language is TypeScript. A JavaScript-only paste still often grades, but the chrome says `solution.ts` and `TypeScript`. Stay on the TS fixture unless you changed preferred language and cleared today's assignment.
- After `Accepted`, `Run tests` is gone and the editor is read-only. Clear data before another submit proof.
- `monaco-set` must run against the solution editor (index 0). After a pass a second Monaco instance holds the reference solution.
- Grading needs the mock executor. If the UI hangs on `Running tests…`, doctor the executor `/health` and read `/tmp/verify-daily-challenges/run/executor.log`.
- Opening `/challenges` seeds the mock user. Do not use this feature as a setup step before onboarding.
