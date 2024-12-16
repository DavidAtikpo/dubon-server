const emailConfig = {
  development: {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.DEV_EMAIL_USER,
      pass: process.env.DEV_EMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  production: {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.DEV_EMAIL_USER || 'temp@example.com',
      pass: process.env.DEV_EMAIL_APP_PASSWORD || 'temp_password'
    }
  }
};

// Désactiver temporairement la vérification des credentials en production
const config = emailConfig[process.env.NODE_ENV || 'development'];
// if (!config.auth.user || !config.auth.pass) {
//   console.error('Configuration email manquante pour l\'environnement:', process.env.NODE_ENV);
// }

export default config; 