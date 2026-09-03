/* ==========================================================================
   Site configuration — the only file non-developers should need to edit.
   Fill these in before the production deploy (see README.md).
   ========================================================================== */
window.TT_CONFIG = {
  // Email capture. 'mailchimp' | 'brevo' | 'none' ('none' = demo mode, no data sent)
  emailProvider: 'none',

  // Mailchimp: the "action" URL from Audience → Signup forms → Embedded forms.
  // Looks like: https://thrivingtalents.us21.list-manage.com/subscribe/post?u=XXXX&id=YYYY
  mailchimpAction: '',

  // Brevo: the form "action" URL from Contacts → Forms → Share → HTML.
  // Looks like: https://sibforms.com/serve/MUIFAAAA...
  brevoAction: '',

  // Calendly booking link (opens in a new tab). Slot owner: Weizi or an AM.
  calendlyUrl: 'https://calendly.com/thrivingtalents/demo',

  // Optional: a direct link to the playbook PDF shown on the thank-you state
  // as a fallback if the auto-email is delayed. Leave blank to hide.
  playbookUrl: '',

  // Analytics. GA4 measurement ID like 'G-XXXXXXXXXX'. Leave blank to disable.
  ga4Id: '',
  // Vercel Web Analytics (enable in the Vercel project first).
  vercelAnalytics: true,

  // frntlne logo file for the 'Powered by' co-brand mark (header + footer).
  // Drop the file into assets/ and set the path, e.g. '/assets/frntlne-logo.svg'.
  // Leave blank to show the text wordmark.
  frntlneLogo: '',

  // HRD Corp registration number shown on the badge.
  hrdcNumber: ''
};
