# Thriving Talents Learning Platform — HRLC landing page

Single static page for the HRLC booth QR code. Plain HTML, CSS and vanilla JS. No build step.

```
index.html   page markup (six sections per the PRD)
styles.css   styles, TT brand tokens at the top (navy #101C3E, gold #FDB72E)
config.js    the only file to edit before launch: email tool, Calendly, analytics
script.js    form handling, analytics events, scroll depth, sticky CTA
assets/      TT logo (colour + white), favicon, OG image
vercel.json  caching + security headers
```

## Before production deploy

Edit `config.js`:

| Key | What to put |
| --- | --- |
| `emailProvider` | `'mailchimp'` or `'brevo'`. Leave `'none'` for staging QA (form succeeds locally, nothing is sent). |
| `mailchimpAction` | Mailchimp → Audience → Signup forms → Embedded forms → copy the form `action` URL. |
| `brevoAction` | Brevo → Contacts → Forms → Share → copy the form `action` URL. |
| `calendlyUrl` | The demo booking link (Weizi or AM roster). Opens in a new tab. |
| `playbookUrl` | Optional direct PDF link shown on the thank-you state as a fallback. |
| `ga4Id` | GA4 measurement ID (`G-…`). Blank disables GA4. |
| `vercelAnalytics` | `true` once Web Analytics is switched on in the Vercel project. |
| `frntlneLogo` | Path to the frntlne logo file once received, e.g. `/assets/frntlne-logo.svg`. Replaces the text wordmark in the header and footer. |
| `hrdcNumber` | HRD Corp registration number for the badge. |

The playbook auto-email is configured inside Mailchimp/Brevo (welcome automation on the list/form), not in this repo.

## Analytics events

| Event | When |
| --- | --- |
| `page_view` | automatic (GA4 and Vercel) |
| `email_capture` | form submitted successfully |
| `email_capture_error` | provider rejected or timed out |
| `demo_click` | "Book a demo" clicked |
| `scroll_depth` | `percent: 50` and `percent: 100`, once each |

With `emailProvider: 'none'` every event is also logged to the browser console for QA.

## Content still to swap in

- **TT client logos.** Section 5 shows Maybank, KWSP/EPF, AIA, HSBC, RHB, FWD, Mastercard and Sime Darby Plantation from the TT client-logo folder in Drive (`assets/logos/`). Remove any Michael has not cleared by deleting its `<li>`. EY is not in the folder; add `assets/logos/ey.png` and an `<li>` if cleared.
- **frntlne client logos.** Shown as text wordmarks using the names frntlne publishes on its own site (Google, Coca-Cola, L'Oréal, Bacardi, Pernod Ricard, Ryanair, Asahi Beverages, Ramsay Health). Replace with logo files only after Datuk confirms what TT may display.
- **Product screenshots.** Section 3 uses CSS-drawn previews. Replace each `.tool-ui` block with a real frntlne screenshot (`<img>`, ~700px wide, compressed) when available.
- **frntlne co-brand mark.** Currently a text wordmark. Drop the official logo into `assets/` and set `frntlneLogo` in `config.js`; no HTML edit needed.
- **HRDC wording.** Badge says "HRD Corp registered training provider" (no scheme claim). Adjust once the open question in the PRD is settled.
- **Tool descriptions.** Course / Mimic / Playbook one-liners are drafted from the product names. Verify with Weizi.

## Local preview

```
npx serve .
```

## Deploy

Push to `main`; Vercel builds from the repo root with no framework preset. Add the custom domain (`learn.thrivingtalents.com` or `platform.thrivingtalents.com`) in the Vercel project and create the CNAME at the DNS provider.
