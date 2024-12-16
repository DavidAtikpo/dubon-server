import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD // Mot de passe d'application Gmail
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    // Vérifier la configuration
    await transporter.verify();
    console.log('Configuration SMTP vérifiée');

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
    console.error('Erreur d\'envoi d\'email:', {
      message: error.message
    });
    return false;
  }
};

export default sendEmail;
