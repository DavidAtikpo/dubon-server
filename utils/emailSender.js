import nodemailer from 'nodemailer';

const sendEmail = async (mailOptions) => {
  try {
    // Créer un transporteur SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Utiliser un mot de passe d'application Google
      }
    });

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', info.messageId);
    return info;
  } catch (error) {
    console.error('Erreur d\'envoi d\'email:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email');
  }
};

export default sendEmail;
