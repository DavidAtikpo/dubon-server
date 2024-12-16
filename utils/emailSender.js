import nodemailer from 'nodemailer';
import emailConfig from '../config/emailConfig.js';

const transporter = nodemailer.createTransport(emailConfig);

const sendEmail = async (to, subject, html) => {
  try {
    console.log('Tentative d\'envoi d\'email avec la configuration:', {
      environment: process.env.NODE_ENV,
      emailUser: emailConfig.auth.user
    });

    const mailOptions = {
      from: `"DuBon Service" <${emailConfig.auth.user}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès:', info.messageId);
    return true;
  } catch (error) {
    console.error('Erreur d\'envoi d\'email:', error);
    return false;
  }
};

export default sendEmail;
