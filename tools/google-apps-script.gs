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
    'Someone from our team will be in touch by the end of this week to walk you through the platform and answer anything you want to ask before you commit to it.',
    'Asah programmes are HRD Corp claimable. If you tell us your levy situation when we speak, we will point you at the scheme that fits.',
    'If you need us sooner, just reply to this email.',
    'Thriving Talents\n' + REPLY_TO,
    '--\nYou are receiving this because you registered on the Asah early access page. Reply with "unsubscribe" and we will remove you.'
  ].join('\n\n');
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
    MailApp.sendEmail({
      to: email,
      subject: SUBJECT,
      body: confirmationText(name),
      name: FROM_NAME,
      replyTo: REPLY_TO
    });
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
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: '[preview] ' + SUBJECT,
    body: confirmationText('Eugene'),
    name: FROM_NAME,
    replyTo: REPLY_TO
  });
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
