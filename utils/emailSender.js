import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Vérifier les credentials
console.log('Vérification des credentials email:', {
  user: process.env.EMAIL_USER ? 'Défini' : 'Non défini',
  pass: process.env.EMAIL_APP_PASSWORD ? 'Défini' : 'Non défini'
});

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Utiliser SSL/TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true // Activer les logs de débogage
});

// Vérifier la configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Erreur de configuration SMTP:', error);
  } else {
    console.log('Serveur SMTP prêt à envoyer des emails');
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log('Configuration email utilisée:', {
      from: process.env.EMAIL_USER,
      to: to
    });

    const mailOptions = {
      from: {
        name: 'Dubon Service',
        address: process.env.EMAIL_USER
      },
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès:', {
      messageId: info.messageId,
      response: info.response
    });
    return true;
  } catch (error) {
    console.error('Erreur détaillée lors de l\'envoi:', {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command
    });
    throw error;
  }
};

export default sendEmail;
