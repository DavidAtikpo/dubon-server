import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Recharger les variables d'environnement
dotenv.config();

const sendEmail = async (mailOptions) => {
  // Vérifier les credentials avant de tenter l'envoi
  if (!process.env.EMAIL || !process.env.PASSWORD) {
    console.error('Erreur de configuration email:', {
      email: process.env.EMAIL ? 'Défini' : 'Non défini',
      password: process.env.PASSWORD ? 'Défini' : 'Non défini'
    });
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      },
      debug: true // Activer les logs de debug
    });

    // Vérifier la connexion
    await transporter.verify();
    console.log('Connexion SMTP vérifiée avec succès');

    // Envoyer l'email
    const info = await transporter.sendMail({
      ...mailOptions,
      from: process.env.EMAIL // S'assurer que l'expéditeur est correct
    });

    console.log('Email envoyé avec succès:', {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    return info;
  } catch (error) {
    console.error('Erreur détaillée d\'envoi d\'email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    return null;
  }
};

export default sendEmail;
