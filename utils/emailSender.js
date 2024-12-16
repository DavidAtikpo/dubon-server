import nodemailer from 'nodemailer';

const createTransporter = () => {
  // Vérifier que les credentials sont présents
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.error('Credentials email manquants');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    },
    debug: true // Pour voir les logs détaillés
  });
};

const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('Impossible de créer le transporteur email');
    return false;
  }

  try {
    // Vérifier la connexion SMTP
    await transporter.verify();
    console.log('Connexion SMTP vérifiée avec succès');

    const mailOptions = {
      from: `"DuBon Service" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès:', info.messageId);
    return true;
  } catch (error) {
    console.error('Erreur détaillée:', {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command
    });
    return false;
  }
};

export default sendEmail;
