export const emailConfig = {
  clientId: process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET,
  refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  user: process.env.EMAIL_USER,
  redirectUri: 'https://developers.google.com/oauthplayground'
}; 