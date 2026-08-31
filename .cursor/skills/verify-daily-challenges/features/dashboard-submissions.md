# Dashboard submissions

Dashboard lists past graded runs and opens one submission to show tests, the user's code, and the reference solution when the run was Accepted.

## Sub-features

- `submissions-empty` shows the empty copy when the user has no runs.
- `submissions-row` lists date, challenge, language, status, score, and `View`.
- `submissions-detail` opens `/dashboard/submissions/:id` with tests and code.
- `submissions-reference` shows `Reference solution` only when status is `Accepted`.

## How to get to it (user POV)

- Open `http://127.0.0.1:3010/dashboard`.
- Choose `Dashboard` in the header or footer.
- Land here after onboarding.
- Choose `View` on a table row.

## Driving it with browser.mjs

Preconditions:

- `scripts/doctor.sh` exits 0.
- For the empty path, clear data so no submissions exist. For the detail path, run `feature daily-challenge` first so an Accepted row exists.

- **Empty state.** After `request DELETE /api/test/clear-data`, run `node scripts/browser.mjs goto /dashboard`. Tab `Submissions` is active. Copy includes `No submissions yet` and link `Open today's challenge`.
- **Populated list.** After a pass on Today, run `node scripts/browser.mjs goto /dashboard`. A row for `Sum Array Elements` shows status `Accepted` and score `100`. Button `View` is present.
- **Open detail.** Run `node scripts/browser.mjs click --role button --name "View"`. Heading `Submission Details` appears. Fields include `Challenge`, `Status`, `Score`, `Your code`. Because this row is Accepted, `Reference solution` is visible.
- **Proof.** Screenshot `dashboard/detail-accepted.png` shows `Accepted`, `Sum Array Elements`, and `Reference solution`. `scripts/db.sh 'SELECT status, score FROM "Submission" ORDER BY "createdAt" DESC LIMIT 1;'` matches the page.

## Gotchas

- The submissions API keys by Clerk id (`mock_clerk_user`), not the Prisma user id. Do not paste a database `User.id` into `/api/submissions/:id`.
- Empty-state `Open today's challenge` seeds and assigns today. Fine after onboarding is done. Not fine if you still need the onboarding form.
- Pagination controls exist (`Previous` / `Next`) but a single fixture run stays on page 1.
- A `Wrong Answer` detail page must not show `Reference solution`. Prove that with a fail-only submit if you claim the fail path.
