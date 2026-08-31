# Landing and about

Landing introduces Daily Code Challenge and sends a signed-in mock user to today's problem or to the about page. About explains the daily loop and returns to the same challenge entry.

## Sub-features

- `landing-hero` shows the product name, pitch, and both CTAs.
- `landing-mock-badge` shows `Mock` in the header on every page.
- `landing-nav` reaches About, Today, and Dashboard from Primary nav.
- `about-copy` shows the how-a-day-works steps and the challenge CTA.

## How to get to it (user POV)

- Open `http://127.0.0.1:3010/`.
- Choose `How it works` on the home hero.
- Choose `About` in the header or footer.
- Choose `Open today's challenge` on home or about.

## Driving it with browser.mjs

Preconditions:

- `scripts/doctor.sh` exits 0.
- Chrome is the instance launched by this run.

- **Home.** Open the landing page. Run `node scripts/browser.mjs goto /`. The heading `Daily Code Challenge` is visible and the header contains `Mock`.
- **Hero CTAs.** The links `Open today's challenge` and `How it works` are visible. Do not follow `Open today's challenge` if the next feature you need is onboarding. That visit seeds the mock user.
- **About via hero.** Choose `How it works`. Run `node scripts/browser.mjs click --role link --name "How it works"`. The heading `Daily Code Challenge` remains and `How a day works` is visible.
- **About via nav.** From any page, choose `About`. Run `node scripts/browser.mjs click --role link --name "About"`. Same about content.
- **Primary nav.** Run `node scripts/browser.mjs snapshot --path landing/nav.aria.txt`. The navigation named `Primary` includes `About`, `Today`, and `Dashboard`.
- **Proof.** Run `node scripts/browser.mjs screenshot --path landing/home.png` on `/` and `node scripts/browser.mjs screenshot --path landing/about.png` on `/about`. Both shots show `Mock` and `Daily Code Challenge`.

## Gotchas

- In mock mode `isSignedIn` is always true, so the header `Enter` button is not shown. Look for `Mock`, not `Enter`.
- `Open today's challenge` hits `/challenges` and seeds `mock_clerk_user`. Skip that click when proving onboarding next.
- The visible badge reads `MOCK` because of CSS `uppercase`. The DOM text is `Mock`.
