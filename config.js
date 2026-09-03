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

  // Analytics. GA4 measurement ID like 'G-XXXXXXXXXX'. Leave blank to disable.
  ga4Id: '',
  // Vercel Web Analytics (enable in the Vercel project first).
  vercelAnalytics: true,

  // Overrides the frntlne co-brand logo in the header and footer.
  // The page ships with /assets/frntlne-logo-white.svg (reverse version, for the
  // navy background). /assets/frntlne-logo.svg is the original full-colour file,
  // for use on light backgrounds. Leave blank to keep the shipped logo.
  frntlneLogo: ''
};
