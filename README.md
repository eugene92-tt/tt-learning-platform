# Asah — early access landing page

Asah is the Thriving Talents Learning Platform, powered by frntlne.

Single static page behind the booth QR code. Plain HTML, CSS and vanilla JS. No build step.

The page deliberately names no event. Every promise to the visitor is "we'll get in
touch by the end of the week" — keep it that way unless the event is confirmed as a
sponsor-level mention, since naming a conference on a public page is a claim about
association with it.

```
index.html   page markup (six sections per the PRD)
styles.css   styles, Asah tokens at the top (Graphite #23262B, Spark #F0552E, Stone #5C6B78)
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
Submissions are tagged `SOURCE=ASAH` so this campaign's signups can be segmented
later. Which QR code was scanned is recorded separately as `QRSOURCE` (see below),
so per-event reporting does not need the event named on the page.

## Branding

The page uses the Asah identity from `assets/asah-brand-kit/`. Working copies of
the files the site actually serves live in `assets/`:

- `asah-logo-on-dark.svg` — the kit's on-dark lockup with its opaque `#1A1C20`
  background rectangle removed, so it sits on the Graphite header cleanly.

The header sets the logo and its tagline as one sentence: the wordmark supplies
"asah" and the text continues "is Malay for sharpen." on the same baseline. The
alignment is not a guess. The SVG box extends 9.211% of its width below the
wordmark baseline, so the image carries a matching negative `margin-bottom` and
sits in inline flow, where a replaced element's bottom margin edge lands on the
text baseline. Flexbox is deliberately not used here: it does not honour the
margin edge when baseline-aligning images, which leaves the tagline ~14px low.
- `fonts/*.woff2` — Plus Jakarta Sans subset to Latin plus the accents Malaysian
  names need, 51KB for three weights instead of 387KB of TTF.
- favicons and the app icon, copied from the kit.

Spark is used for the mark, the primary button, focus states and the product
mockups only. It is never used for body text: on white it reaches 3.4:1, well
under the 4.5:1 needed. The button pairs Spark with Night rather than Graphite,
which clears 4.8:1.

Two faults in the supplied kit, worth fixing at source:

1. `asah-logo-horizontal-tagline-on-dark.svg` is byte-identical to the
   non-tagline file — the dark tagline lockup has no tagline. The light version
   is correct. The page does not use it, since the frntlne credit is set
   separately as "Powered by exclusive partner" with the real frntlne logo.
2. The on-dark lockups include an opaque `#1A1C20` background rectangle, so they
   show a visible box on any background that is not exactly Night.

`.vercelignore` keeps `assets/asah-brand-kit/` out of the deploy. The brand guide
in there states the name has not been cleared and lists the MyIPO, SSM and domain
checks still outstanding, so it must not be reachable from a public URL.

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
there is no confirmation email, and there is no unsubscribe link, so the footer's "unsubscribe any time"
has to be honoured by hand or by moving the list into a proper email tool. The page
now promises contact **by the end of the week**, which is a commitment someone has to
keep: either an autoresponder goes in before the QR codes are printed, or a named
person works the sheet every Friday.

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

In the footer the frntlne credit is a co-brand, not a peer: `.cobrand-logo` is fixed at
15px tall against the TT logo's 47px, so it reads at about a third of TT's height, the
same proportion the printed flyer uses. Change it in `.cobrand-logo`, not on `.foot-brand
img` — that selector is deliberately `>`-scoped to the direct child so it cannot stretch
the nested frntlne file to the wrong aspect ratio.

`assets/logos/rieckermann-logo.svg` ships from the brand owner with roughly 25% empty
padding above and below the artwork inside a `0 0 300 100` viewBox. The logo wall sizes
every logo by height, so that padding made it render at half the optical weight of the
others. The viewBox is tightened to the ink bounds (`24.1 26.2 251.2 49.3`). Do the same
to any new logo that arrives with built-in margin.

### HRD Corp badges

`assets/hrdc-claimable.png` and `assets/hrdc-registered.png` are 160×160 web copies
(7KB and 9KB) generated from the print masters supplied in the repo root of `assets/`.
The masters are 17,344px and 3,601px square and are excluded in `.vercelignore` — they
must not ship. Regenerate the web copies from the masters rather than upscaling these.

The `.hrdc` strip sits under the client logo wall and carries the flyer's line: **"HRD Corp
claimable. Drop us your email so we can explain which scheme can be used to claim
this."** This is a claim about TT's HRD Corp registration, so keep the wording as HRD
Corp approves it — "claimable" describes the programme, not a guarantee that any
particular levy claim will be approved.

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
