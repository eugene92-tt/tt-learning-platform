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
seen, Last seen, Campaign, QR source, Form, Submissions and Confirmation.

### The confirmation email

The same script sends the confirmation, so there is no email tool to buy or
connect. On a first-time signup it emails the person immediately, then writes
the send time into the **Confirmation** column. The column is the record of who
has actually been written to: a timestamp means sent, anything else means not.

Settings live in the `CONFIRMATION` block at the top of the script —
`SEND_CONFIRMATION` (set `false` to turn it off without removing anything),
`HTML_EMAIL`, `FROM_NAME`, `REPLY_TO`, `SUBJECT`, `SITE_URL`, and
`confirmationText()` / `confirmationHtml()` for the body. Both bodies promise
contact by the end of the week because the page does; change one and change all
three.

Every message is multipart — the branded HTML plus the plain text as the
fallback — so the text version is never a second-class copy. Set
`HTML_EMAIL: false` to send text alone.

**The HTML follows the Asah brand guide, and is deliberately thin.** A Graphite
`#23262B` header carries the white-wordmark lockup (the guide's on-dark rule),
with a single 3px Spark `#F0552E` rule beneath it. That rule is the *only* Spark
in the message: the guide allows one accent per surface and forbids Spark body
text, which on white reaches only 3.4:1. Body copy is Graphite, the footer is
Stone `#5C6B78`. There is no button, because there is nothing to click — the
call to action is "reply".

Three constraints shaped it, and they are worth knowing before anyone asks for
something richer:

- **Webfonts do not load.** Gmail and Outlook strip `@font-face`, so Plus
  Jakarta Sans is named first and a system stack does the actual work. Brand
  typography is not available in email; the wordmark has to be an image.
- **Remote images are blocked by default in Outlook.** The logo is therefore
  *embedded* as an inline `cid:` attachment, fetched once from `SITE_URL` and
  cached for six hours so no signup waits on a download. If the fetch fails the
  email still sends, with the wordmark set as text.
- **Dark modes recolour.** `color-scheme: light only` is declared so Gmail and
  Outlook do not invert the Graphite header into a pale grey.

The signup's name is HTML-escaped before it reaches the template. It is the one
piece of attacker-controlled text in the message.

`assets/asah-email-logo.png` is the header logo at 320px (displayed at 160), on
transparent, generated from `assets/asah-logo-on-dark.svg`. It has to stay
publicly reachable at `SITE_URL + LOGO_PATH` or the embed falls back to text.

### The share card

`assets/og-image.jpg` is the 1200x630 Open Graph card. Its source is
`tools/og-image.html` — open that at exactly 1200x630, screenshot at 2x, then
downsample and save as JPEG q88. The 2x render is what keeps the wordmark edges
clean once JPEG has had it.

It follows the same rules as everything else on-brand: flat Graphite ground (the
guide's Don't list rules out gradients and glows), the header lockup with its
tagline, and exactly one Spark accent — the rule along the bottom. The right
column carries the HRD Corp badge rather than a decorative mark, on the white
disc it is drawn for: navy artwork straight onto Graphite goes muddy and the
ring type disappears. A shared link is skimmed in a WhatsApp group, and the
thing that earns the tap is the credential, not ornament.

`SITE_URL` is `https://asah.thrivingtalents.com`. It is the one setting that has
to match the live domain: point it somewhere unreachable and the email still
sends, silently, with a text wordmark instead of the logo. `index.html` uses the
same host for its canonical URL and Open Graph tags, which have to be absolute.

Four things about this are deliberate:

- **Only new signups get mail.** The browser retries opaquely when it cannot
  read our reply, so a second POST for the same address is normal. It bumps the
  row and sends nothing.
- **A mail failure never loses the signup.** The row is written and the lock
  released before the send is attempted; a failure writes `failed: …` into the
  Confirmation column and the request still returns `ok`.
- **Quota is handled, not ignored.** Apps Script allows 100 recipients a day on
  a consumer Gmail account and 1,500 on Workspace. When the quota is gone the
  row is marked `quota exhausted` rather than dropped, and `doGet()` reports
  the remaining quota so you can check it before a busy day.
- **There is a way to catch up.** Run `resendMissingConfirmations()` from the
  Apps Script editor and it retries every row that is not already stamped with
  a date. It is safe to run twice.

`previewConfirmation()` sends one copy to whoever owns the script, so you can
read the real email before the QR codes are printed. Do that first.

Mail goes out as the Google account that owns the script, so deploy it from a
Thriving Talents Workspace account. Deployed from a personal Gmail address, the
confirmation arrives from a gmail.com sender claiming to be Thriving Talents,
which is both bad for trust and likely to be filtered.

### Tracking which QR code was scanned

Any `?src=` value in the URL is stored against the signup, so print a separate
QR code per placement and you will know where each lead came from:

    https://asah.thrivingtalents.com/?src=booth
    https://asah.thrivingtalents.com/?src=talk

The value is remembered for the session, so it survives the visitor scrolling
or reloading. Signups with no `src` show as blank in the sheet and as `direct`
in analytics. Nothing about this is visible to the visitor.

For Mailchimp and Brevo the name is sent as `FNAME` / `FIRSTNAME` and the QR
source as `QRSOURCE`; both merge fields have to exist on the list first.

What this still does not do: there is no unsubscribe *link*. The confirmation
asks people to reply with "unsubscribe", which someone has to actually action by
hand, and the footer's "unsubscribe any time" is only as true as that habit. The
first time you send a real campaign to this list rather than a one-to-one
confirmation, move it into Mailchimp or Brevo — a bulk send with no one-click
unsubscribe is what gets a sending domain flagged.

The confirmation buys you the week; it does not do the follow-up. The page
promises contact **by the end of the week** and only a person can keep that, so
name who works the sheet before the QR codes are printed.

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

## Future CHRO 2026 event page

`/future-chro-2026` is the RSVP page for the invitation-only session on
Friday 13 November 2026, 9.30am to 12.30pm MYT, at UOA Academy, Bangsar South.
Its files are `future-chro-2026/index.html`, `future-chro-2026/event.css`,
`future-chro-2026/event.ics` and `assets/future-chro-2026/`. It shares
`/styles.css`, `/script.js` and `/config.js` with the main page.

**How RSVPs work.** Michael invites people personally; only those who are coming
fill in the form. Each RSVP lands on its own **Future CHRO 2026** tab (Email,
Name, Company, Job title, Mobile, First seen, Last seen, QR source, Submissions,
Confirmation) and gets one "see you there" email with a calendar invite
attached. There is no invite list and no seat cap: that tab *is* the attendee
list. Someone RSVPing twice keeps one row, gets their newest details saved, and
is not emailed again.

**Closing RSVPs.** Set `futureChroRsvpOpen: false` in `config.js`. The form is
replaced by a short "RSVPs are closed" note pointing to sales@.

**The Apps Script.** RSVPs are routed by `source: 'FUTURE-CHRO-2026'` at the top
of `doPost`; everything else takes the early-access path exactly as before.
After pasting the updated script, use **Deploy -> Manage deployments -> edit
(pencil) -> Version: New version**. Do not choose "New deployment": it issues a
new `/exec` URL and the live main page would keep posting to the old one. Run
`previewRsvpConfirmation()` once to read the email in your own inbox, and
`resendMissingRsvpConfirmations()` after any quota or mail failure.

**Every path on the page is absolute.** With `cleanUrls` and no trailing slash
the page is served at `/future-chro-2026`, so a relative `event.css` would
resolve to `/event.css` and 404.

**The page is `noindex`.** It is invitation-only, so it shares by link but stays
out of search results.

**To swap in when they arrive:**
- Speaker photos are the originals, cropped to 560px squares with the head at
  54% of the frame and the eye line at 36% so the three read as one set. Their
  white studio backgrounds are kept as they are. Datuk Hishamudin's source was
  only 400px, so a larger original would sharpen his photo on retina screens.
- UOA Academy logo: replace the typeset `.ev-logo-uoa` span in the header with
  an `<img>` (white version, SVG preferred).
- Share card: `tools/og-future-chro-2026.html` -> `assets/future-chro-2026/og.jpg`,
  regenerated the same way as the main card.

**Wording deliberately different from the poster:** the headline is "Are you a
future CHRO with a commercial mindset?" (the poster's "Are you future CHROs
with Commercial Mindset?" is ungrammatical); "7-11 Malaysia" is written as
7-Eleven Malaysia; the page does not promise "20 seats", because 20 is a target
rather than a limit.

## Content still to swap in

- **Client logo wall.** Section 5 shows one unlabelled wall of logos from `assets/logos/`: Google, Coca-Cola, P&G, L'Oreal, Ryanair, Versace, Michael Kors, Rieckermann. These are frntlne's clients, and the wall does not say so — confirm with Datuk that TT is cleared to display them before the production deploy. To add or remove one, edit the single `<li>` in the `.logo-wall` list and drop the file into `assets/logos/`. Give it a size class by shape: `lw-sq` (square), `lw-m` (about 3:1), `lw-w` (about 5:1), `lw-xw` (8:1 or wider) — this keeps every logo at a similar optical weight.
- **Product screenshots.** Section 3 uses CSS-drawn previews. Replace each `.tool-ui` block with a real frntlne screenshot (`<img>`, ~700px wide, compressed) when available.
- **Tool descriptions.** Course / Mimic / Playbook one-liners are drafted from the product names. Verify with Weizi.

## Local preview

```
npx serve .
```

## Deploy

Push to `main`; Vercel builds from the repo root with no framework preset. Add the custom domain (`asah.thrivingtalents.com`) in the Vercel project and create the CNAME at the DNS provider.
