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
const SITE_URL  = 'https://learn.thrivingtalents.com';
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
    'Asah programmes are HRD Corp claimable. If you tell us your levy situation when we speak, we will point you at the scheme that fits.',
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
    'Your place in the first cohort is reserved, and Asah programmes are HRD Corp claimable.',
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
    p('Asah programmes are <strong style="font-weight:700;">HRD Corp claimable</strong>. If you tell us your levy situation when we speak, we will point you at the scheme that fits.'),
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
const COL_EMAIL = 1, COL_NAME = 2, COL_LAST = 4, COL_COUNT = 8, COL_CONFIRM = 9;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (TOKEN && TOKEN !== 'CHANGE-ME' && body.token !== TOKEN) {
      return json({ ok: false, error: 'bad token' });
    }

    const email = String(body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'bad email' });

    const name = String(body.name || '').trim();
    let isNew = false;
    let row = 0;

    // Two people can submit at the same moment at a busy booth; the lock stops
    // their rows landing on top of each other.
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = getSheet();
      const now = new Date();
      const rowIndex = findEmailRow(sheet, email);

      if (rowIndex === -1) {
        sheet.appendRow([
          email, name, now, now,
          body.source || '', body.qrSource || '', body.location || '', 1, ''
        ]);
        row = sheet.getLastRow();
        isNew = true;
      } else {
        // Already registered. Keep one row per person rather than adding a
        // duplicate — this also absorbs the client's retry after a blocked read.
        row = rowIndex;
        sheet.getRange(row, COL_LAST).setValue(now);
        if (name && !String(sheet.getRange(row, COL_NAME).getValue()).trim()) {
          sheet.getRange(row, COL_NAME).setValue(name);
        }
        const count = sheet.getRange(row, COL_COUNT).getValue() || 1;
        sheet.getRange(row, COL_COUNT).setValue(count + 1);
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
  if (!SEND_CONFIRMATION) {
    sheet.getRange(row, COL_CONFIRM).setValue('off');
    return;
  }
  try {
    // Better to leave the row marked "quota" and send it by hand than to
    // throw away the signup for the rest of the day.
    if (MailApp.getRemainingDailyQuota() < 1) {
      sheet.getRange(row, COL_CONFIRM).setValue('quota exhausted');
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
    sheet.getRange(row, COL_CONFIRM).setValue(new Date());
  } catch (err) {
    sheet.getRange(row, COL_CONFIRM).setValue('failed: ' + String(err).slice(0, 200));
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
  const last = sheet.getLastRow();
  if (last < 2) return;
  const rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  let sent = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][COL_CONFIRM - 1] instanceof Date) continue;
    if (!EMAIL_RE.test(String(rows[i][COL_EMAIL - 1]).trim())) continue;
    if (MailApp.getRemainingDailyQuota() < 1) break;
    sendConfirmation(String(rows[i][COL_EMAIL - 1]).trim(), String(rows[i][COL_NAME - 1]).trim(), i + 2);
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
    return sheet;
  }
  // A sheet created before the confirmation column existed is one column
  // short; widen it in place rather than making anyone rebuild the sheet.
  if (sheet.getLastColumn() < HEADERS.length) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  }
  return sheet;
}

function findEmailRow(sheet, email) {
  const last = sheet.getLastRow();
  if (last < 2) return -1;
  const values = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === email) return i + 2;
  }
  return -1;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
