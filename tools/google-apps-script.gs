/**
 * Thriving Talents Learning Platform — Asah signup capture.
 *
 * Receives signups from the landing page, appends them to this spreadsheet,
 * and sends the signup an immediate confirmation email. See README.md
 * ("Collecting signups in Google Sheets") for the deploy steps — the short
 * version:
 *
 *   1. Open the Google Sheet that should hold the signups.
 *   2. Extensions -> Apps Script, delete the placeholder, paste this file.
 *   3. Set TOKEN below to any random string, and check the CONFIRMATION
 *      block underneath it.
 *   4. Deploy -> New deployment -> Web app.
 *        Execute as:       Me
 *        Who has access:   Anyone
 *   5. Authorise when prompted. The consent screen now also asks to send mail
 *      as you — that is the confirmation email, and it is required.
 *   6. Copy the /exec URL into sheetsEndpoint in config.js, and the same
 *      TOKEN into sheetsToken.
 *
 * Re-deploy (Deploy -> Manage deployments -> edit -> Version: New version)
 * after any change to this file, or the live URL keeps serving the old code.
 */

// Must match sheetsToken in config.js. Keeps random traffic out of the sheet.
const TOKEN = 'CHANGE-ME';

/* ---------- Confirmation email ---------- */
// Sent once per person, the moment they sign up. Mail goes out as whichever
// Google account owns this script, so deploy it from a Thriving Talents
// Workspace account — a signup from a personal gmail address looks like spam.
const SEND_CONFIRMATION = true;
const FROM_NAME = 'Thriving Talents';
const REPLY_TO  = 'sales@thrivingtalents.com';
const SUBJECT   = 'Your Asah early access place';

// Set HTML_EMAIL to false to send the plain-text version alone. Every message
// is multipart either way, so the text below is what a reader sees when their
// client refuses HTML — it is never a second-class version.
const HTML_EMAIL = true;

// Where the logo is fetched from. Point it at the deployed site with no
// trailing slash. Leave it empty and the email still sends, wordmark set as
// text instead of an image.
const SITE_URL  = 'https://asah.thrivingtalents.com';
const LOGO_PATH = '/assets/asah-email-logo.png';

// The page promises contact by the end of the week, so this email has to
// arrive first and say the same thing. Keep the two in step: if the page copy
// changes, change this too.
//
// Each paragraph is ONE line with no hard wrapping. Mail clients render
// text/plain in a proportional font and wrap it to the reader's window, so
// pre-wrapped lines come out as a ragged zigzag on a phone.
function confirmationText(name) {
  return [
    name ? 'Hi ' + name + ',' : 'Hi,',
    'Thanks for registering your interest in Asah, the Thriving Talents Learning Platform. Your place in the first cohort is reserved.',
    'The Asah learning reinforcement platform is HRD Corp claimable. If you are interested, we can point you at the scheme that fits when we speak.',
    'Someone from our team will be in touch by the end of this week to walk you through the platform and answer anything you want to ask before you commit to it.',
    'If you need us sooner, just reply to this email.',
    'Thriving Talents\n' + REPLY_TO,
    '--\nYou are receiving this because you registered on the Asah early access page. Reply with "unsubscribe" and we will remove you.'
  ].join('\n\n');
}

/* ---------- HTML version ---------- */
// Deliberately plain. Asah's brand guide allows one Spark accent per surface,
// so Spark is spent on the rule under the header and nowhere else; body text
// is Graphite and the footer is Stone. There is no button because there is
// nothing to click: the call to action is "reply".
//
// Webfonts do not load in Gmail or Outlook, so Plus Jakarta Sans is named
// first and a system stack carries the rest. The layout is tables with inline
// styles for the same reason — Outlook renders with Word, not a browser.
const FONT_STACK = "'Plus Jakarta Sans', -apple-system, 'Segoe UI', Roboto, Arial, Helvetica, sans-serif";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * @param {string} name      the signup's name, escaped here, never before
 * @param {string} logoSrc   a cid: reference, an absolute URL, or '' for none
 */
function confirmationHtml(name, logoSrc) {
  const p = function (text, last) {
    return '<p style="margin:0 0 ' + (last ? '0' : '16px') + ';">' + text + '</p>';
  };
  const logo = logoSrc
    ? '<img src="' + logoSrc + '" width="160" height="63" alt="Asah" ' +
      'style="display:block;border:0;outline:none;width:160px;height:63px;">'
    : '<span style="font-family:' + FONT_STACK + ';font-size:26px;font-weight:700;' +
      'letter-spacing:-.02em;color:#FFFFFF;">asah</span>';

  return [
    '<!DOCTYPE html><html lang="en"><head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    // Gmail and Outlook dark modes recolour anything they think is unstyled.
    // Declaring light-only keeps Graphite from being inverted to a pale grey.
    '<meta name="color-scheme" content="light only">',
    '<meta name="supported-color-schemes" content="light only">',
    '<title>' + SUBJECT + '</title></head>',
    '<body style="margin:0;padding:0;width:100%;background:#E9EEF1;">',

    // The line shown next to the subject in the inbox list. Without it the
    // client previews "Hi Nurul," which wastes the only free impression.
    '<div style="display:none;max-height:0;max-width:0;opacity:0;overflow:hidden;' +
      'font-size:1px;line-height:1px;color:#E9EEF1;">',
    'Your place in the first cohort is reserved, and Asah is HRD Corp claimable.',
    '</div>',

    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
      'bgcolor="#E9EEF1" style="background:#E9EEF1;border-collapse:collapse;">',
    '<tr><td align="center" style="padding:24px 12px;">',
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" ' +
      'style="width:100%;max-width:600px;background:#FFFFFF;border-collapse:collapse;">',

    // Header: white wordmark and Spark mark on Graphite, per the guide's
    // on-dark rule. Padding is the clearspace of x on all sides.
    '<tr><td bgcolor="#23262B" style="background:#23262B;padding:26px 32px;">' + logo + '</td></tr>',
    '<tr><td bgcolor="#F0552E" style="background:#F0552E;font-size:0;line-height:0;height:3px;">&#8203;</td></tr>',

    '<tr><td style="padding:32px;font-family:' + FONT_STACK + ';font-size:16px;' +
      'line-height:1.6;color:#23262B;">',
    p(name ? 'Hi ' + escapeHtml(name) + ',' : 'Hi,'),
    p('Thanks for registering your interest in Asah, the Thriving Talents Learning Platform. Your place in the first cohort is reserved.'),
    p('The Asah learning reinforcement platform is <strong style="font-weight:700;">HRD Corp claimable</strong>. If you are interested, we can point you at the scheme that fits when we speak.'),
    p('Someone from our team will be in touch by the end of this week to walk you through the platform and answer anything you want to ask before you commit to it.'),
    p('If you need us sooner, just reply to this email.'),
    '<p style="margin:28px 0 0;">',
    '<strong style="font-weight:700;">Thriving Talents</strong><br>',
    '<a href="mailto:' + REPLY_TO + '" style="color:#23262B;text-decoration:underline;">' + REPLY_TO + '</a>',
    '</p>',
    '</td></tr>',

    // The footer stays on white with a hairline above it. Tinting it would
    // match the page ground and the card would lose its bottom edge.
    '<tr><td style="padding:18px 32px 26px;border-top:1px solid #E9EEF1;font-family:' +
      FONT_STACK + ';font-size:12px;line-height:1.55;color:#5C6B78;">',
    'You are receiving this because you registered on the Asah early access page. ',
    'Reply with &#8220;unsubscribe&#8221; and we will remove you.',
    '</td></tr>',

    '</table></td></tr></table></body></html>'
  ].join('');
}

const SHEET_NAME = 'Signups';
const HEADERS = [
  'Email', 'Name', 'First seen', 'Last seen',
  'Campaign', 'QR source', 'Form', 'Submissions', 'Confirmation'
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (TOKEN && TOKEN !== 'CHANGE-ME' && body.token !== TOKEN) {
      return json({ ok: false, error: 'bad token' });
    }

    const email = String(body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'bad email' });

    // Event RSVPs have their own tab and their own email. Nothing below this
    // line runs for them, so the early-access flow is exactly as it was.
    if (body.source === EVENT.campaign) return json(handleRsvp(body, email));

    const name = String(body.name || '').trim();
    let isNew = false;
    let row = 0;

    // Two people can submit at the same moment at a busy booth; the lock stops
    // their rows landing on top of each other.
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = getSheet();
      const c = columnsFor(sheet, HEADERS);
      const now = new Date();
      const rowIndex = findEmailRow(sheet, email, c.col['Email']);

      if (rowIndex === -1) {
        sheet.appendRow(rowFor(sheet, c, {
          'Email': email, 'Name': name, 'First seen': now, 'Last seen': now,
          'Campaign': body.source || '', 'QR source': body.qrSource || '',
          'Form': body.location || '', 'Submissions': 1
        }));
        row = sheet.getLastRow();
        isNew = true;
      } else {
        // Already registered. Keep one row per person rather than adding a
        // duplicate — this also absorbs the client's retry after a blocked read.
        row = rowIndex;
        sheet.getRange(row, c.col['Last seen']).setValue(now);
        if (name && !String(sheet.getRange(row, c.col['Name']).getValue()).trim()) {
          sheet.getRange(row, c.col['Name']).setValue(name);
        }
        bump(sheet, row, c.col['Submissions']);
      }
    } finally {
      lock.releaseLock();
    }

    // Only first-time signups get mail. The client retries opaquely when it
    // cannot read our reply, and a second submit would otherwise send a second
    // copy of the same email to the same person.
    if (isNew) sendConfirmation(email, name, row);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Visiting the /exec URL in a browser should say "ok" — a quick way to check
// the deployment is live before the booth opens. It also reports how much of
// today's mail quota is left, which is the thing most likely to run out.
function doGet() {
  return json({
    ok: true,
    service: 'tt-asah-signups',
    // Opening the /exec URL shows whether the RSVP code is the version live.
    handles: ['early-access', EVENT.campaign],
    mailQuotaRemaining: SEND_CONFIRMATION ? MailApp.getRemainingDailyQuota() : null
  });
}

/**
 * Sends the confirmation and stamps column I with the result, so the sheet
 * always says who has actually been written to. A mail failure never fails
 * the signup: the row is already saved by the time we get here.
 */
function sendConfirmation(email, name, row) {
  const sheet = getSheet();
  const confirmCol = columnsFor(sheet, HEADERS).col['Confirmation'];
  if (!SEND_CONFIRMATION) {
    sheet.getRange(row, confirmCol).setValue('off');
    return;
  }
  try {
    // Better to leave the row marked "quota" and send it by hand than to
    // throw away the signup for the rest of the day.
    if (MailApp.getRemainingDailyQuota() < 1) {
      sheet.getRange(row, confirmCol).setValue('quota exhausted');
      return;
    }
    const opts = {
      to: email,
      subject: SUBJECT,
      body: confirmationText(name),
      name: FROM_NAME,
      replyTo: REPLY_TO
    };
    if (HTML_EMAIL) {
      // An embedded image beats a linked one here: Outlook blocks remote
      // images by default and a lot of Malaysian HR runs Outlook. If the fetch
      // fails the email still goes, with the wordmark set as text.
      const logo = logoBlob();
      if (logo) {
        opts.inlineImages = { asahLogo: logo };
        opts.htmlBody = confirmationHtml(name, 'cid:asahLogo');
      } else {
        opts.htmlBody = confirmationHtml(name, '');
      }
    }
    MailApp.sendEmail(opts);
    sheet.getRange(row, confirmCol).setValue(new Date());
  } catch (err) {
    sheet.getRange(row, confirmCol).setValue('failed: ' + String(err).slice(0, 200));
  }
}

/**
 * Run this by hand (Apps Script editor -> Run) after a quota day or a mail
 * outage. It picks up every row whose Confirmation cell is not a date and
 * tries again. Safe to run twice: a row that succeeds gets a timestamp and is
 * skipped next time.
 */
function resendMissingConfirmations() {
  const sheet = getSheet();
  const c = columnsFor(sheet, HEADERS);
  const last = sheet.getLastRow();
  if (last < 2) return;
  const rows = sheet.getRange(2, 1, last - 1, c.width).getValues();
  const at = function (r, h) { return r[c.col[h] - 1]; };
  let sent = 0;
  for (let i = 0; i < rows.length; i++) {
    if (at(rows[i], 'Confirmation') instanceof Date) continue;
    const to = String(at(rows[i], 'Email')).trim();
    if (!EMAIL_RE.test(to)) continue;
    if (MailApp.getRemainingDailyQuota() < 1) break;
    sendConfirmation(to, String(at(rows[i], 'Name')).trim(), i + 2);
    sent++;
  }
  Logger.log('resendMissingConfirmations: sent ' + sent);
}

/**
 * Sends one confirmation to whoever owns this script, so you can read the
 * real thing before the QR codes are printed. Does not touch the sheet.
 */
function previewConfirmation() {
  const opts = {
    to: Session.getEffectiveUser().getEmail(),
    subject: '[preview] ' + SUBJECT,
    body: confirmationText('Eugene'),
    name: FROM_NAME,
    replyTo: REPLY_TO
  };
  if (HTML_EMAIL) {
    const logo = logoBlob();
    if (logo) {
      opts.inlineImages = { asahLogo: logo };
      opts.htmlBody = confirmationHtml('Eugene', 'cid:asahLogo');
    } else {
      opts.htmlBody = confirmationHtml('Eugene', '');
      Logger.log('Logo could not be fetched from ' + SITE_URL + LOGO_PATH +
                 ' — check SITE_URL is deployed and the file is public.');
    }
  }
  MailApp.sendEmail(opts);
}

/**
 * The header logo, fetched once and cached for six hours. A signup should not
 * wait on a download, and the file changes about never.
 */
function logoBlob() {
  if (!SITE_URL) return null;
  try {
    const cache = CacheService.getScriptCache();
    let b64 = cache.get('asah-email-logo');
    if (!b64) {
      const res = UrlFetchApp.fetch(SITE_URL + LOGO_PATH, { muteHttpExceptions: true });
      if (res.getResponseCode() !== 200) return null;
      b64 = Utilities.base64Encode(res.getBlob().getBytes());
      cache.put('asah-email-logo', b64, 21600);
    }
    return Utilities.newBlob(Utilities.base64Decode(b64), 'image/png', 'asah-logo.png');
  } catch (err) {
    return null;
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function findEmailRow(sheet, email, col) {
  const last = sheet.getLastRow();
  if (last < 2) return -1;
  const values = sheet.getRange(2, col || 1, last - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === email) return i + 2;
  }
  return -1;
}

/**
 * Finds every column by its header text, so the team can add, remove or
 * reorder columns by hand (LinkedIn, Position, notes...) without the script
 * writing into the wrong ones. A required header that has gone missing is
 * added at the right-hand end; nothing is ever inserted or moved.
 */
function columnsFor(sheet, required) {
  const width = Math.max(sheet.getLastColumn(), 1);
  const row1 = sheet.getRange(1, 1, 1, width).getValues()[0];
  const col = {};
  row1.forEach(function (h, i) {
    const key = String(h).trim();
    if (key && !(key in col)) col[key] = i + 1;
  });
  let end = width;
  required.forEach(function (h) {
    if (!col[h]) {
      end += 1;
      sheet.getRange(1, end).setValue(h).setFontWeight('bold');
      col[h] = end;
    }
  });
  return { col: col, width: end };
}

/** A new row as wide as the sheet, each value under its own header. */
function rowFor(sheet, c, values) {
  const row = [];
  for (let i = 0; i < Math.max(c.width, sheet.getLastColumn()); i++) row.push('');
  Object.keys(values).forEach(function (h) { row[c.col[h] - 1] = values[h]; });
  return row;
}

/** Adds one to a counter cell. Number() so a stray word can never become "HRLC1". */
function bump(sheet, row, column) {
  const cell = sheet.getRange(row, column);
  cell.setValue((Number(cell.getValue()) || 1) + 1);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ==========================================================================
   Future CHRO 2026 — RSVPs
   ==========================================================================
   Invitations go out personally, so only people who are coming fill in the
   form. Each RSVP lands on its own tab and gets one "see you there" email with
   a calendar invite. There is no invite list and no seat cap: the tab is the
   attendee list, and closing the form is a switch in config.js.
*/
const EVENT = {
  campaign: 'FUTURE-CHRO-2026',
  sheet: 'Future CHRO 2026',
  title: 'Future CHROs with a Commercial Mindset',
  // 9.30am–12.30pm MYT (UTC+8) on Friday 13 November 2026
  startUtc: '20261113T013000Z',
  endUtc: '20261113T043000Z',
  when: 'Friday, 13 November 2026, 9.30am to 12.30pm (MYT)',
  where: 'UOA Academy, Bangsar South, Kuala Lumpur',
  url: 'https://asah.thrivingtalents.com/future-chro-2026',
  subject: 'See you on 13 November: Future CHROs with a Commercial Mindset'
};
const RSVP_HEADERS = [
  'Email', 'Name', 'Company', 'Job title', 'Mobile',
  'First seen', 'Last seen', 'QR source', 'Submissions', 'Confirmation'
];

function clip_(v) { return String(v == null ? '' : v).trim().replace(/\s+/g, ' ').slice(0, 200); }

function handleRsvp(body, email) {
  const f = body.fields || {};
  const name = clip_(body.name);
  const company = clip_(f.company), title = clip_(f.title), mobile = clip_(f.mobile);
  let isNew = false, row = 0;

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = getRsvpSheet();
    const c = columnsFor(sheet, RSVP_HEADERS);
    const now = new Date();
    const found = findEmailRow(sheet, email, c.col['Email']);
    if (found === -1) {
      sheet.appendRow(rowFor(sheet, c, {
        'Email': email, 'Name': name, 'Company': company, 'Job title': title, 'Mobile': mobile,
        'First seen': now, 'Last seen': now, 'QR source': clip_(body.qrSource), 'Submissions': 1
      }));
      row = sheet.getLastRow();
      isNew = true;
    } else {
      // Same person again: keep one row, take the newest details they gave.
      row = found;
      const set = function (h, v) { if (v) sheet.getRange(row, c.col[h]).setValue(v); };
      set('Name', name); set('Company', company); set('Job title', title); set('Mobile', mobile);
      sheet.getRange(row, c.col['Last seen']).setValue(now);
      bump(sheet, row, c.col['Submissions']);
    }
  } finally {
    lock.releaseLock();
  }

  // One email per person, however many times the form is sent.
  if (isNew) sendRsvpConfirmation(email, name, row);
  return { ok: true };
}

function getRsvpSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(EVENT.sheet);
  if (!sheet) {
    sheet = ss.insertSheet(EVENT.sheet);
    sheet.appendRow(RSVP_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, RSVP_HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function sendRsvpConfirmation(email, name, row) {
  const sheet = getRsvpSheet();
  const confirmCol = columnsFor(sheet, RSVP_HEADERS).col['Confirmation'];
  const stamp = function (v) { sheet.getRange(row, confirmCol).setValue(v); };
  if (!SEND_CONFIRMATION) return stamp('off');
  try {
    if (MailApp.getRemainingDailyQuota() < 1) return stamp('quota exhausted');
    const opts = {
      to: email,
      subject: EVENT.subject,
      body: rsvpText(name),
      name: FROM_NAME,
      replyTo: REPLY_TO,
      attachments: [Utilities.newBlob(eventIcs(), 'text/calendar', 'future-chro-2026.ics')]
    };
    if (HTML_EMAIL) opts.htmlBody = rsvpHtml(name);
    MailApp.sendEmail(opts);
    stamp(new Date());
  } catch (err) {
    stamp('failed: ' + String(err).slice(0, 200));
  }
}

/** Retries every RSVP whose Confirmation cell is not a date. Safe to run twice. */
function resendMissingRsvpConfirmations() {
  const sheet = getRsvpSheet();
  const c = columnsFor(sheet, RSVP_HEADERS);
  const last = sheet.getLastRow();
  if (last < 2) return;
  const rows = sheet.getRange(2, 1, last - 1, c.width).getValues();
  const at = function (r, h) { return r[c.col[h] - 1]; };
  let sent = 0;
  for (let i = 0; i < rows.length; i++) {
    if (at(rows[i], 'Confirmation') instanceof Date) continue;
    const to = String(at(rows[i], 'Email')).trim();
    if (!EMAIL_RE.test(to)) continue;
    if (MailApp.getRemainingDailyQuota() < 1) break;
    sendRsvpConfirmation(to, String(at(rows[i], 'Name')).trim(), i + 2);
    sent++;
  }
  Logger.log('resendMissingRsvpConfirmations: sent ' + sent);
}

/** Sends the RSVP email to the script owner, for reading before invitations go out. */
function previewRsvpConfirmation() {
  const opts = {
    to: Session.getEffectiveUser().getEmail(),
    subject: '[preview] ' + EVENT.subject,
    body: rsvpText('Eugene'),
    name: FROM_NAME,
    replyTo: REPLY_TO,
    attachments: [Utilities.newBlob(eventIcs(), 'text/calendar', 'future-chro-2026.ics')]
  };
  if (HTML_EMAIL) opts.htmlBody = rsvpHtml('Eugene');
  MailApp.sendEmail(opts);
}

function googleCalendarLink() {
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent(EVENT.title) +
    '&dates=' + EVENT.startUtc + '/' + EVENT.endUtc +
    '&location=' + encodeURIComponent(EVENT.where) +
    '&details=' + encodeURIComponent(EVENT.url);
}

// RFC 5545: CRLF line ends, and commas, semicolons and backslashes escaped in
// text values. A stable UID means a second copy updates the same calendar
// entry instead of adding another.
function eventIcs() {
  const esc = function (t) { return String(t).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n'); };
  const stamp = Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'");
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Thriving Talents//Future CHRO 2026//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:future-chro-2026@thrivingtalents.com',
    'DTSTAMP:' + stamp,
    'DTSTART:' + EVENT.startUtc,
    'DTEND:' + EVENT.endUtc,
    'SUMMARY:' + esc(EVENT.title),
    'LOCATION:' + esc(EVENT.where),
    'DESCRIPTION:' + esc('Featuring Datuk Hishamudin Hasan. Co-hosted by Haikal (UOA Group) and Michael Teoh Su Lim (Thriving Talents).\n' + EVENT.url),
    'URL:' + EVENT.url,
    'END:VEVENT',
    'END:VCALENDAR'
  ].map(fold).join('\r\n') + '\r\n';
}

// Content lines longer than 75 octets must be folded: CRLF then a space.
function fold(line) {
  const out = [];
  while (line.length > 75) { out.push(line.slice(0, 75)); line = ' ' + line.slice(75); }
  out.push(line);
  return out.join('\r\n');
}

function rsvpText(name) {
  return [
    name ? 'Hi ' + name + ',' : 'Hi,',
    "Thank you for your RSVP. You're on the list for " + EVENT.title + '.',
    'When: ' + EVENT.when + '\nWhere: ' + EVENT.where,
    'Featuring Datuk Hishamudin Hasan, co-hosted by Haikal (UOA Group) and Michael Teoh Su Lim (Thriving Talents).',
    'A calendar invite is attached. To add it to Google Calendar instead: ' + googleCalendarLink(),
    'If your plans change, just reply to this email and let us know.',
    'See you there,\nThriving Talents and UOA Academy\n' + REPLY_TO
  ].join('\n\n');
}

// Typographic only: the event's black and gold, no images, so nothing breaks
// when a mail client blocks pictures. Same table-and-inline-style rules as the
// early-access email.
function rsvpHtml(name) {
  const gold = '#C8932E', ink = '#16181B', muted = '#5C6470';
  const p = function (t, last) { return '<p style="margin:0 0 ' + (last ? '0' : '16px') + ';">' + t + '</p>'; };
  const fact = function (k, v) {
    return '<tr><td style="padding:6px 16px 6px 0;font-size:12px;font-weight:700;letter-spacing:.12em;' +
      'text-transform:uppercase;color:' + muted + ';white-space:nowrap;vertical-align:top;">' + k + '</td>' +
      '<td style="padding:6px 0;font-size:16px;color:' + ink + ';">' + v + '</td></tr>';
  };
  return [
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">',
    '<title>' + escapeHtml(EVENT.subject) + '</title></head>',
    '<body style="margin:0;padding:0;background:#EEEDEA;">',
    '<div style="display:none;max-height:0;max-width:0;opacity:0;overflow:hidden;font-size:1px;line-height:1px;color:#EEEDEA;">',
    "You're on the list. Friday 13 November, 9.30am at UOA Academy, Bangsar South.",
    '</div>',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EEEDEA" style="background:#EEEDEA;border-collapse:collapse;">',
    '<tr><td align="center" style="padding:24px 12px;">',
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border-collapse:collapse;">',
    '<tr><td bgcolor="#0D0E10" style="background:#0D0E10;padding:28px 32px;font-family:' + FONT_STACK + ';">',
    '<div style="font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#E9B44C;">By invitation &middot; 13 November 2026</div>',
    '<div style="margin-top:10px;font-size:24px;line-height:1.2;font-weight:700;color:#FFFFFF;">' + escapeHtml(EVENT.title) + '</div>',
    '</td></tr>',
    '<tr><td bgcolor="#E9B44C" style="background:#E9B44C;font-size:0;line-height:0;height:3px;">&#8203;</td></tr>',
    '<tr><td style="padding:32px;font-family:' + FONT_STACK + ';font-size:16px;line-height:1.6;color:' + ink + ';">',
    p(name ? 'Hi ' + escapeHtml(name) + ',' : 'Hi,'),
    p("Thank you for your RSVP. You&#8217;re on the list."),
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;border-collapse:collapse;font-family:' + FONT_STACK + ';">',
    fact('When', 'Friday, 13 November 2026<br>9.30am &ndash; 12.30pm (MYT)'),
    fact('Where', escapeHtml(EVENT.where)),
    '</table>',
    p('Featuring <strong>Datuk Hishamudin Hasan</strong>, co-hosted by Haikal (UOA Group) and Michael Teoh Su Lim (Thriving Talents).'),
    p('A calendar invite is attached. Using Google Calendar? <a href="' + googleCalendarLink() + '" style="color:' + ink + ';text-decoration:underline;">Add it there instead</a>.'),
    p('If your plans change, just reply to this email and let us know.'),
    '<p style="margin:28px 0 0;"><strong>Thriving Talents and UOA Academy</strong><br>',
    '<a href="mailto:' + REPLY_TO + '" style="color:' + ink + ';text-decoration:underline;">' + REPLY_TO + '</a></p>',
    '</td></tr>',
    '<tr><td style="padding:18px 32px 26px;border-top:1px solid #EEEDEA;font-family:' + FONT_STACK + ';font-size:12px;line-height:1.55;color:' + muted + ';">',
    'You are receiving this because you RSVPed at ' + EVENT.url.replace('https://', '') + '. We use your details only to run this session; they are shared with co-host UOA Academy.',
    '</td></tr>',
    '</table></td></tr></table></body></html>'
  ].join('');
}
