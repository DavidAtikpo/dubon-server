import Handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs/promises';

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Charger et compiler un template
const loadTemplate = async (templateName) => {
  const templatePath = path.join(process.cwd(), 'templates', 'emails', `${templateName}.hbs`);
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  return Handlebars.compile(templateContent);
};

// Envoyer un email
export const sendEmail = async ({
  to,
  subject,
  template,
  context,
  attachments = []
}) => {
  try {
    // Charger et compiler le template
    const compiledTemplate = await loadTemplate(template);
    const html = compiledTemplate(context);

    // Configuration de l'email
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      attachments
    };

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', info.messageId);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

// Envoyer un email de confirmation
export const sendConfirmationEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Confirmez votre compte',
    template: 'confirmation',
    context: {
      name: user.name,
      confirmationUrl: `${process.env.FRONTEND_URL}/confirm-email?token=${user.emailVerificationToken}`
    }
  });
};

// Envoyer un email de réinitialisation de mot de passe
export const sendPasswordResetEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe',
    template: 'password-reset',
    context: {
      name: user.name,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${user.resetPasswordToken}`
    }
  });
};

// Envoyer un email de notification de commande
export const sendOrderNotification = async (order, user) => {
  await sendEmail({
    to: user.email,
    subject: `Commande #${order.orderNumber} - Confirmation`,
    template: 'order-confirmation',
    context: {
      orderNumber: order.orderNumber,
      userName: user.name,
      orderDate: new Date(order.createdAt).toLocaleDateString('fr-FR'),
      orderTotal: order.total,
      orderItems: order.items
    }
  });
};

// Enregistrer des helpers Handlebars personnalisés
Handlebars.registerHelper('formatDate', (date) => {
  return new Date(date).toLocaleDateString('fr-FR');
});

Handlebars.registerHelper('formatPrice', (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(price);
});

Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

export default {
  sendEmail,
  sendConfirmationEmail,
  sendPasswordResetEmail,
  sendOrderNotification
}; 