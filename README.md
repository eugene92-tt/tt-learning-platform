# Thriving Talents Learning Platform — HRLC landing page

Single static page for the HRLC booth QR code. Plain HTML, CSS and vanilla JS. No build step.

```
index.html   page markup (six sections per the PRD)
styles.css   styles, TT brand tokens at the top (navy #101C3E, gold #FDB72E)
config.js    the only file to edit before launch: email tool, Calendly, analytics
script.js    form handling, analytics events, scroll depth, sticky CTA
assets/      TT logo (colour + white), frntlne logo, favicon, OG image
vercel.json  caching + security headers
```

## Before production deploy

Edit `config.js`:

| Key | What to put |
| --- | --- |
| `emailProvider` | `'mailchimp'` or `'brevo'`. Leave `'none'` for staging QA (form succeeds locally, nothing is sent). |
| `mailchimpAction` | Mailchimp → Audience → Signup forms → Embedded forms → copy the form `action` URL. |
| `brevoAction` | Brevo → Contacts → Forms → Share → copy the form `action` URL. |
| `ga4Id` | GA4 measurement ID (`G-…`). Blank disables GA4. |
| `vercelAnalytics` | `true` once Web Analytics is switched on in the Vercel project. |
| `frntlneLogo` | Optional override for the frntlne co-brand logo. The page already ships with the reverse logo; only set this to swap in a different file. |

Both forms register interest for early access rather than delivering a lead magnet.
The page has two identical capture forms (hero and closing section); submitting either
switches both to the thank-you state. Any confirmation or
welcome email is configured inside Mailchimp/Brevo (automation on the list/form), not in this repo.
Submissions are tagged `SOURCE=HRLC` so booth signups can be segmented later.

## Analytics events

| Event | When |
| --- | --- |
| `page_view` | automatic (GA4 and Vercel) |
| `email_capture` | form submitted successfully (`location`: `hero` or `closing`) |
| `email_capture_error` | provider rejected or timed out |
| `scroll_depth` | `percent: 50` and `percent: 100`, once each |

With `emailProvider: 'none'` every event is also logged to the browser console for QA.

## Logos

`assets/frntlne-logo.svg` is the original full-colour file. Its wordmark is near-black
(`#002851`), which disappears on the navy header and footer, so the page uses
`assets/frntlne-logo-white.svg` — the same file with only the seven wordmark letters
recoloured to white. The stacked ribbon mark is untouched. Use the full-colour file on
any light background.

## Content still to swap in

- **Client logo wall.** Section 5 shows one unlabelled wall of logos from `assets/logos/`: Google, Coca-Cola, P&G, L'Oreal, Ryanair, Versace, Michael Kors, Rieckermann. These are frntlne's clients, and the wall does not say so — confirm with Datuk that TT is cleared to display them before the production deploy. To add or remove one, edit the single `<li>` in the `.logo-wall` list and drop the file into `assets/logos/`. Give it a size class by shape: `lw-sq` (square), `lw-m` (about 3:1), `lw-w` (about 5:1), `lw-xw` (8:1 or wider) — this keeps every logo at a similar optical weight.
- **Product screenshots.** Section 3 uses CSS-drawn previews. Replace each `.tool-ui` block with a real frntlne screenshot (`<img>`, ~700px wide, compressed) when available.
- **Tool descriptions.** Course / Mimic / Playbook one-liners are drafted from the product names. Verify with Weizi.

## Local preview

```
npx serve .
```

## Deploy

Push to `main`; Vercel builds from the repo root with no framework preset. Add the custom domain (`learn.thrivingtalents.com` or `platform.thrivingtalents.com`) in the Vercel project and create the CNAME at the DNS provider.
