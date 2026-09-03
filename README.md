# Thriving Talents Learning Platform — HRLC landing page

Single static page for the HRLC booth QR code. Plain HTML, CSS and vanilla JS. No build step.

```
index.html   page markup (six sections per the PRD)
styles.css   styles, TT brand tokens at the top (navy #101C3E, gold #FDB72E)
config.js    the only file to edit before launch: email tool, Calendly, analytics
script.js    form handling, analytics events, scroll depth, sticky CTA
assets/      TT logo (colour + white), frntlne logo, favicon, OG image
tools/       Google Apps Script endpoint for Sheets capture
vercel.json  caching + security headers
```

## Before production deploy

Edit `config.js`:

| Key | What to put |
| --- | --- |
| `emailProvider` | `'sheets'`, `'mailchimp'` or `'brevo'`. Leave `'none'` for staging QA (form succeeds locally, nothing is sent). |
| `sheetsEndpoint` | The Apps Script web app `/exec` URL (see below). |
| `sheetsToken` | Must match `TOKEN` inside the Apps Script. |
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

## Collecting signups in Google Sheets

The page posts each signup straight from the visitor's browser to a Google
Apps Script web app, which appends it to a sheet. No server of ours sits in
the middle, and nothing is stored on Vercel.

1. Create (or open) the Google Sheet that should hold the signups.
2. **Extensions -> Apps Script**, delete the placeholder, and paste
   `tools/google-apps-script.gs`.
3. Set `TOKEN` at the top of that file to any random string.
4. **Deploy -> New deployment -> Web app**, with *Execute as* **Me** and
   *Who has access* **Anyone**. Approve the permission prompt.
5. Copy the `/exec` URL into `sheetsEndpoint` in `config.js`, put the same
   token in `sheetsToken`, and set `emailProvider: 'sheets'`.

Opening the `/exec` URL in a browser should return `{"ok":true,...}`. That is
the quickest way to confirm the deployment is live.

After editing the script, **Deploy -> Manage deployments -> edit -> Version:
New version**, or the live URL keeps serving the old code.

The sheet keeps one row per address: a repeat signup bumps *Last seen* and
*Submissions* rather than adding a duplicate. Columns are Email, Name, First
seen, Last seen, Campaign, QR source, Form and Submissions.

### Tracking which QR code was scanned

Any `?src=` value in the URL is stored against the signup, so print a separate
QR code per placement and you will know where each lead came from:

    https://learn.thrivingtalents.com/?src=booth
    https://learn.thrivingtalents.com/?src=talk

The value is remembered for the session, so it survives the visitor scrolling
or reloading. Signups with no `src` show as blank in the sheet and as `direct`
in analytics. Nothing about this is visible to the visitor.

For Mailchimp and Brevo the name is sent as `FNAME` / `FIRSTNAME` and the QR
source as `QRSOURCE`; both merge fields have to exist on the list first.

Two things this does not do, both of which matter once you email these people:
there is no confirmation email (the page only promises to be in touch after
HRLC), and there is no unsubscribe link, so the footer's "unsubscribe any time"
has to be honoured by hand or by moving the list into a proper email tool.

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
