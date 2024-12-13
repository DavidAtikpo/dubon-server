import nodemailer from 'nodemailer';

const sendEmail = async (mailOptions) => {
  try {
    // Utiliser les variables d'environnement existantes
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL, // "maximnyansa75@gmail.com"
        pass: process.env.PASSWORD // "uqpo lean remu tzjb"
      }
    });

    // Log pour debug
    console.log('Configuration email:', {
      user: process.env.EMAIL,
      passLength: process.env.PASSWORD ? process.env.PASSWORD.length : 0
    });

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', info.messageId);
    return info;
  } catch (error) {
    console.error('Erreur détaillée d\'envoi d\'email:', error);
    // Ne pas bloquer l'inscription si l'email échoue
    return null;
  }
};

export default sendEmail;
