import twilio from 'twilio';
import Handlebars from 'handlebars';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const templates = {
  'seller-new-order': 'Nouvelle commande #{{orderNumber}} reçue pour un total de {{total}} FCFA ({{items}} articles)',
  'seller-low-stock': 'Alerte stock bas pour {{products.length}} produits',
  'seller-withdrawal': 'Votre retrait de {{amount}} FCFA a été {{status}}'
};

export const sendSMS = async ({ to, template, data }) => {
  try {
    const templateText = templates[template];
    if (!templateText) {
      throw new Error('Template SMS non trouvé');
    }

    const compiledTemplate = Handlebars.compile(templateText);
    const message = compiledTemplate(data);

    await client.messages.create({
      body: message,
      to,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    return true;
  } catch (error) {
    console.error('Erreur envoi SMS:', error);
    return false;
  }
}; 