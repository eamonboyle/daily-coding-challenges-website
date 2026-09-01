# Onboarding

Onboarding lets a first-time mock user pick a username and preferred language, then lands on the dashboard. The form is skipped when that user already exists.

## Sub-features

- `onboarding-form` shows `Complete your profile` when no user row exists.
- `onboarding-submit` creates the user and navigates to `/dashboard`.
- `onboarding-skip` redirects to `/dashboard` when `GET /api/user/mock_clerk_user` is 200.

## How to get to it (user POV)

- Open `http://127.0.0.1:3010/onboarding` after a user reset.
- Production Login redirects here. Mock mode never shows Login.

## Driving it with browser.mjs

Preconditions:

- `scripts/doctor.sh` exits 0.
- Mock user is absent. Create that state first.

- **Reset user.** Run `node scripts/browser.mjs request DELETE /api/test/clear-data?resetUser=1`. Response includes `"resetUser":true`.
- **Confirm absence.** Run `scripts/db.sh "SELECT count(*) FROM \"User\" WHERE \"clerkId\" = 'mock_clerk_user';"` and expect `0`.
- **Open form.** Run `node scripts/browser.mjs goto /onboarding`. Heading `Complete your profile` appears with `#username`, `#language`, `#emailAlerts`, and button `Complete profile`. If the page bounces to Dashboard, a user was seeded after the reset. Stop and reset again. Do not visit `/challenges` in between.
- **Fill.** Run `node scripts/browser.mjs fill --selector "#username" --value "verifyuser"`, `node scripts/browser.mjs select --selector "#language" --value "javascript"`. Leave `Receive email alerts` checked unless the recipe says otherwise.
- **Submit.** Run `node scripts/browser.mjs click --role button --name "Complete profile"`. The app navigates to `/dashboard` with heading `Dashboard`.
- **Proof.** `scripts/db.sh "SELECT username, \"preferredLanguageSlug\", \"emailAlerts\" FROM \"User\" WHERE \"clerkId\" = 'mock_clerk_user';"` returns `verifyuser`, `javascript`, `t`. Screenshot `onboarding/dashboard-after.png` shows Dashboard, not the form.

## Gotchas

- `GET /api/user/:id` does not seed. `requireUser()` does. `/challenges`, daily, submit, profile GET/PUT, and submissions list all seed. After `resetUser=1`, only `/` , `/about`, and `/onboarding` are safe until the form is submitted.
- Doctor is safe. It only loads `/`.
- Username must be unique. A leftover `verifyuser` from a previous run without `resetUser` will fail create. Reset user, or pick a new username.
- Email alerts default to checked. Assert the checkbox state before submit if the recipe cares.
- Choosing JavaScript here is how a later daily challenge becomes the JS fixture. Today's assignment does not exist yet, so this is the right time to set language.
