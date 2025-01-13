import Handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Obtenir le chemin absolu du dossier actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: true, // true pour le port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Vérifier la connexion email au démarrage
const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Configuration email vérifiée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur configuration email:', error);
    return false;
  }
};

// Fonction pour vérifier si un email semble valide
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Configuration pour l'environnement
const isProduction = process.env.NODE_ENV === 'production';

// Fonction pour convertir une image en base64 avec compression
const getImageAsBase64 = async (imagePath) => {
  try {
    console.log('Tentative de lecture du logo depuis:', imagePath);
    
    const imageBuffer = await fs.readFile(imagePath);
    
    // Si en production, utiliser l'URL du site
    if (isProduction) {
      return `${process.env.FRONTEND_URL}/images/logo.png`;
    }
    
    // En local, utiliser base64
    const base64Image = imageBuffer.toString('base64');
    const extension = path.extname(imagePath).slice(1);
    return `data:image/${extension};base64,${base64Image}`;
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du logo:', error);
    // Utiliser une URL de fallback si disponible
    return process.env.LOGO_URL || null;
  }
};

// Fonction d'envoi d'email générique
export const sendEmail = async ({ to, subject, template, context, html, text }) => {
  try {
    // Vérification de l'email
    if (!isValidEmail(to)) {
      console.error('❌ Adresse email invalide:', to);
      throw new Error('Adresse email invalide');
    }

    let emailHtml = html;
    
    if (template && context) {
      const templatePath = path.join(process.cwd(), 'templates', 'emails', `${template}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiledTemplate = Handlebars.compile(templateContent);
      emailHtml = compiledTemplate(context);
    }

    const mailOptions = {
      from: '"DUBON SERVICES" <e-bon-services@dubonservice.info>',
      to: to.trim(), // Supprimer les espaces inutiles
      subject,
      html: emailHtml,
      text: text || 'Veuillez activer HTML pour voir ce message.',
      replyTo: 'e-bon-services@dubonservice.info'
    };

    // Log avant l'envoi
    console.log('🔄 Tentative d\'envoi d\'email à:', to);

    const info = await transporter.sendMail(mailOptions);
    
    // Log après l'envoi réussi
    console.log('✅ Email envoyé avec succès');
    console.log('📧 De:', mailOptions.from);
    console.log('📨 À:', to);
    console.log('🆔 Message ID:', info.messageId);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:');
    console.error('- Destinataire:', to);
    console.error('- Erreur:', error.message);
    throw error;
  }
};

// Fonction d'envoi d'email de bienvenue
export const sendWelcomeEmail = async (user) => {
  if (!user || !user.email) {
    throw new Error('Données utilisateur invalides pour l\'envoi d\'email');
  }

  const cleanEmail = user.email.trim().toLowerCase();
  
  if (!isValidEmail(cleanEmail)) {
    throw new Error('Email utilisateur invalide');
  }

  // Chemin du logo
  const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
  
  // Obtenir le logo (base64 en local, URL en production)
  const logoSrc = await getImageAsBase64(logoPath);

  console.log('Mode:', isProduction ? 'Production' : 'Développement');
  console.log('Source du logo:', logoSrc ? 'Disponible' : 'Non disponible');

  return sendEmail({
    to: cleanEmail,
    subject: 'Bienvenue sur DUBON SERVICES',
    template: 'welcome',
    context: {
      name: user.name,
      email: cleanEmail,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      logoSrc: logoSrc
    }
  });
};

export const sendConfirmationEmail = async (user, confirmationUrl) => {
  await sendEmail({
    to: user.email,
    subject: 'Confirmez votre compte',
    template: 'confirmation',
    context: {
      name: user.name,
      confirmationUrl
    }
  });
};

export const sendPasswordResetEmail = async (user, resetUrl) => {
  await sendEmail({
    to: user.email,
    subject: 'Réinitialisation de mot de passe',
    template: 'password-reset',
    context: {
      name: user.name,
      resetUrl
    }
  });
};

export const sendOrderNotification = async (order, user) => {
  await sendEmail({
    to: user.email,
    subject: 'Confirmation de commande',
    template: 'order-confirmation',
    context: {
      userName: user.name,
      orderNumber: order.id,
      orderDate: order.createdAt,
      orderTotal: order.total
    }
  });
};

export const sendSubscriptionConfirmEmail = async (user, subscription) => {
  await sendEmail({
    to: user.email,
    subject: 'Abonnement confirmé',
    template: 'seller-subscription-confirm',
    context: {
      name: user.name,
      planName: subscription.planName,
      expiryDate: subscription.expiresAt
    }
  });
};

export const sendSubscriptionEndingEmail = async (user, subscription) => {
  await sendEmail({
    to: user.email,
    subject: 'Votre abonnement expire bientôt',
    template: 'seller-subscription-expiring',
    context: {
      name: user.name,
      planName: subscription.planName,
      expiryDate: subscription.expiresAt,
      daysRemaining: subscription.daysRemaining,
      renewalUrl: `${process.env.FRONTEND_URL}/seller/subscription/renew`
    }
  });
};

// Exports des fonctions vendeur
export const sendSellerRegistrationApprovedEmail = async (seller) => {
  await sendEmail({
    to: seller.email,
    subject: 'Compte vendeur approuvé',
    template: 'seller-registration-approved',
    context: {
      sellerName: seller.name,
      dashboardUrl: `${process.env.FRONTEND_URL}/seller/dashboard`
    }
  });
};

export const sendSellerRegistrationRejectedEmail = async (seller, reason) => {
  await sendEmail({
    to: seller.email,
    subject: 'Demande de compte vendeur non approuvée',
    template: 'seller-registration-rejected',
    context: {
      sellerName: seller.name,
      rejectionReason: reason,
      supportUrl: `${process.env.FRONTEND_URL}/support`
    }
  });
};

// Autres fonctions d'envoi d'emails vendeur
export const sendSellerNewOrderEmail = async (seller, order) => {
  await sendEmail({
    to: seller.email,
    subject: 'Nouvelle commande reçue',
    template: 'seller-new-order',
    context: {
      orderNumber: order.id,
      total: order.total,
      items: order.items.length
    }
  });
};

export const sendSellerLowStockEmail = async (seller, products) => {
  await sendEmail({
    to: seller.email,
    subject: 'Alerte stock bas',
    template: 'seller-low-stock',
    context: { products }
  });
};

// Fonction de test pour vérifier la configuration email
export const testEmailConfiguration = async () => {
  try {
    console.log('Test de la configuration email avec les paramètres suivants:');
    console.log({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      secure: true
    });

    await transporter.verify();
    console.log('✅ Configuration email vérifiée avec succès');

    // Envoyer un email de test
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // Envoyer à soi-même
      subject: "Test de configuration email",
      text: "Si vous recevez cet email, la configuration est correcte."
    });

    console.log('✉️ Email de test envoyé:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Erreur de configuration email:', error);
    console.error('Message détaillé:', error.message);
    if (error.code === 'EAUTH') {
      console.error("Problème d'authentification - Vérifiez vos identifiants");
    }
    return false;
  }
};

// Helper Handlebars pour formater les dates
Handlebars.registerHelper('formatDate', function(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Helper Handlebars pour formater les prix
Handlebars.registerHelper('formatPrice', function(price) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(price);
});

export const sendOrderConfirmationEmail = async (order, user) => {
  try {
    const templatePath = path.join(process.cwd(), 'templates', 'emails', 'order-confirmation.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    // Formater les données de la commande
    const orderData = {
      orderNumber: order.id,
      orderDate: new Date(order.createdAt).toLocaleDateString(),
      customerName: user.name,
      customerEmail: user.email,
      items: order.items,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress
    };

    return sendEmail({
      to: user.email,
      subject: `Confirmation de votre commande #${order.id}`,
      template: 'order-confirmation',
      context: orderData
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    throw error;
  }
};

// Ne pas exporter à nouveau les fonctions déjà exportées individuellement 