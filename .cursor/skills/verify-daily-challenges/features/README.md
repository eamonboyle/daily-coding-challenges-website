# Daily Coding Challenges verification map

This directory is the maintained source for verifying user-facing behavior of Daily Code Challenge in mock mode. Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch via `.cursor/skills/verify-daily-challenges/scripts/launch.sh`.
- Doctor via `scripts/doctor.sh` must exit 0.
- Drive only `http://127.0.0.1:3010` against database `daily_coding_challenge_verify`.
- Never drive ports 3000/5000 or database `daily_coding_challenge`.
- Chrome CDP is the browser launched by this run. Do not attach to a user's Chrome.
- Header shows `Mock`. If it does not, stop.

## Driving conventions

- Start every recipe from the baseline unless its preconditions say otherwise.
- Prefer ARIA roles and accessible names. Fall back to the ids in the feature file (`#username`, `#language`).
- Treat commands as literal. Keep quoted names unchanged.
- Helper paths in this map are relative to `.cursor/skills/verify-daily-challenges/`. From the repo root, prefix them with that directory. Example. `node scripts/browser.mjs goto /` is `node .cursor/skills/verify-daily-challenges/scripts/browser.mjs goto /`.
- Browser actions go through `scripts/browser.mjs`.
- SQL proof goes through `scripts/db.sh`.
- Restore fixture state with `browser.mjs request DELETE /api/test/clear-data` (keep user) or `...?resetUser=1` (drop mock user). Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot or body text dump plus a screenshot with the Mock badge visible.
- Mutation proof includes a second view. Re-open the page or query the verify database.
- Record the feature id and entry point with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with browser.mjs` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Landing and about](./landing.md) covers home, about, and primary nav with the Mock badge.
- [Daily challenge](./daily-challenge.md) covers loading today's fixture, failing tests, passing tests, and unlocking the reference solution.
- [Onboarding](./onboarding.md) covers first-time profile creation after a user reset.
- [Dashboard submissions](./dashboard-submissions.md) covers the submissions list and a graded detail page.
- [Edit profile](./edit-profile.md) covers language preference and email alerts.
