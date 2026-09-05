/**
 * Thriving Talents Learning Platform — Asah signup capture.
 *
 * Receives signups from the landing page and appends them to this
 * spreadsheet. See README.md ("Collecting signups in Google Sheets") for
 * the deploy steps — the short version:
 *
 *   1. Open the Google Sheet that should hold the signups.
 *   2. Extensions -> Apps Script, delete the placeholder, paste this file.
 *   3. Set TOKEN below to any random string.
 *   4. Deploy -> New deployment -> Web app.
 *        Execute as:       Me
 *        Who has access:   Anyone
 *   5. Copy the /exec URL into sheetsEndpoint in config.js, and the same
 *      TOKEN into sheetsToken.
 *
 * Re-deploy (Deploy -> Manage deployments -> edit -> Version: New version)
 * after any change to this file, or the live URL keeps serving the old code.
 */

// Must match sheetsToken in config.js. Keeps random traffic out of the sheet.
const TOKEN = 'CHANGE-ME';

const SHEET_NAME = 'Signups';
const HEADERS = ['Email', 'Name', 'First seen', 'Last seen', 'Campaign', 'QR source', 'Form', 'Submissions'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (TOKEN && TOKEN !== 'CHANGE-ME' && body.token !== TOKEN) {
      return json({ ok: false, error: 'bad token' });
    }

    const email = String(body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'bad email' });

    // Two people can submit at the same moment at a busy booth; the lock stops
    // their rows landing on top of each other.
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = getSheet();
      const now = new Date();
      const rowIndex = findEmailRow(sheet, email);

      const name = String(body.name || '').trim();

      if (rowIndex === -1) {
        sheet.appendRow([
          email, name, now, now,
          body.source || '', body.qrSource || '', body.location || '', 1
        ]);
      } else {
        // Already registered. Keep one row per person rather than adding a
        // duplicate — this also absorbs the client's retry after a blocked read.
        sheet.getRange(rowIndex, 4).setValue(now);
        if (name && !String(sheet.getRange(rowIndex, 2).getValue()).trim()) {
          sheet.getRange(rowIndex, 2).setValue(name);
        }
        const count = sheet.getRange(rowIndex, 8).getValue() || 1;
        sheet.getRange(rowIndex, 8).setValue(count + 1);
      }
    } finally {
      lock.releaseLock();
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Visiting the /exec URL in a browser should say "ok" — a quick way to check
// the deployment is live before the booth opens.
function doGet() {
  return json({ ok: true, service: 'tt-asah-signups' });
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
