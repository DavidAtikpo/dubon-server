import twilio from 'twilio';

let client = null;

// Désactivé temporairement jusqu'à l'obtention des identifiants Twilio
console.warn('⚠️ Service SMS désactivé - Identifiants Twilio non configurés');

// Fonction de remplacement pour les SMS
export const sendSMS = async (to, message) => {
  console.log('📱 SMS simulé:', { to, message });
  return true;
};

// Envoyer un code de vérification par SMS
export const sendVerificationCode = async (phoneNumber, code) => {
  const message = `Votre code de vérification DUBON est: ${code}`;
  console.log('📱 Code de vérification simulé:', { phoneNumber, code });
  return true;
};

// Envoyer une notification de commande par SMS
export const sendOrderNotificationSMS = async (phoneNumber, orderNumber) => {
  const message = `Votre commande #${orderNumber} a été confirmée. Merci de votre confiance !`;
  console.log('📱 Notification de commande simulée:', { phoneNumber, orderNumber });
  return true;
};

// Envoyer une alerte de livraison par SMS
export const sendDeliveryNotification = async (phoneNumber, orderNumber, estimatedTime) => {
  const message = `Votre commande #${orderNumber} est en cours de livraison. Temps estimé: ${estimatedTime} minutes.`;
  console.log('📱 Notification de livraison simulée:', { phoneNumber, orderNumber, estimatedTime });
  return true;
};

// Envoyer une notification de promotion par SMS
export const sendPromotionNotification = async (phoneNumber, promoCode, discount) => {
  const message = `Utilisez le code ${promoCode} pour bénéficier de ${discount}% de réduction sur votre prochaine commande !`;
  console.log('📱 Notification de promotion simulée:', { phoneNumber, promoCode, discount });
  return true;
};

export default {
  sendSMS,
  sendVerificationCode,
  sendOrderNotificationSMS,
  sendDeliveryNotification,
  sendPromotionNotification
}; 