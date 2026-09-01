# Edit profile

Profile lets a signed-in user change username, email, preferred language, email alerts, and bio. Language applies to new daily assignments, not today's.

## Sub-features

- `profile-load` shows current values on the Profile tab.
- `profile-language` saves `preferredLanguageSlug`.
- `profile-alerts` saves `emailAlerts`.
- `profile-toast` shows `Your profile has been updated`.

## How to get to it (user POV)

- Open `/dashboard` and choose the `Profile` tab.
- Complete onboarding, then open Profile.

## Driving it with browser.mjs

Preconditions:

- `scripts/doctor.sh` exits 0.
- Mock user exists (visit `/challenges` once, or finish onboarding).

- **Open Profile.** Run `node scripts/browser.mjs goto /dashboard` then `node scripts/browser.mjs click --role tab --name "Profile"`. Heading `Edit profile` appears. Copy includes `Language preference applies to new daily assignments`.
- **Change language.** Run `node scripts/browser.mjs select --selector "select[title='Preferred language']" --value "python"`.
- **Change alerts.** Run `node scripts/browser.mjs uncheck --selector "#emailAlerts"` to turn alerts off, or `check` to turn them on.
- **Save.** Run `node scripts/browser.mjs click --role button --name "Save changes"`. Toast title `Success` and description `Your profile has been updated`. Button may briefly read `Saving…`.
- **Confirm persistence.** Reload Profile. Run `node scripts/browser.mjs goto /dashboard`, click `Profile`, then `node scripts/browser.mjs eval document.querySelector("select[title='Preferred language']").value`. Expect `python`.
- **Proof.** `scripts/db.sh "SELECT \"preferredLanguageSlug\", \"emailAlerts\" FROM \"User\" WHERE \"clerkId\" = 'mock_clerk_user';"` matches the form. Screenshot `profile/saved.png` shows Edit profile plus the toast or the saved select value.

## Gotchas

- Today's fixture language does not change when you save. Clear data and reload `/challenges` to assign a new daily in the saved language.
- Profile GET uses `requireUser()` and will seed a default TypeScript user if you reset the user and then open Dashboard instead of Onboarding.
- Username on this form is a different control from onboarding `#username`. Use the `Username` label / `johndoe` placeholder field here.
- Email is required and must stay a valid address. The seeded value is `mock@example.com`.
