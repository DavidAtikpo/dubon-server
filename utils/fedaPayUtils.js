import { FedaPay, Transaction } from 'fedapay';

// Configuration initiale de FedaPay
const initializeFedaPay = () => {
  const environment = process.env.FEDAPAY_ENVIRONMENT || 'live';
  const apiKey = process.env.FEDAPAY_SECRET_KEY;
  const publicKey = process.env.FEDAPAY_PUBLIC_KEY;

  if (!apiKey) {
    throw new Error(`Clé API FedaPay ${environment} non définie`);
  }

  try {
    // Configuration de base
    FedaPay.setApiKey(apiKey);
    FedaPay.setEnvironment(environment);
    FedaPay.setApiBase(process.env.FEDAPAY_API_URL || 'https://api.fedapay.com');

    console.log('🔧 Configuration FedaPay:', { 
      environment, 
      apiVersion: 'v1',
      keyLength: apiKey.length,
      baseUrl: FedaPay.getApiBase()
    });

    console.log('✓ FedaPay initialisé avec succès');
    return Transaction;
  } catch (error) {
    console.error('⚠️ Erreur d\'initialisation FedaPay:', error.message);
    throw error;
  }
};

export const createFedaPayTransaction = async ({
  amount,
  description,
  customerEmail,
  customerName,
  callbackUrl
}) => {
  console.log('🔄 Début création transaction FedaPay:', {
    amount,
    description,
    customerEmail,
    customerName,
    callbackUrl
  });

  try {
    // Construire l'URL de callback complète
    const baseUrl = process.env.SERVER_URL || 'https://dubon-server.onrender.com';
    // Supprimer les slashes en trop
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const cleanCallbackUrl = callbackUrl.replace(/^\/+/, '');
    const fullCallbackUrl = `${cleanBaseUrl}/${cleanCallbackUrl}`;

    console.log('URL de callback:', fullCallbackUrl);

    const transaction = await initializeFedaPay().create({
      amount: amount,
      currency: {
        iso: 'XOF'
      },
      description: description,
      callback_url: fullCallbackUrl,
      customer: {
        email: customerEmail,
        firstname: customerName
      }
    });

    // Générer le token de paiement
    const tokenResponse = await transaction.generateToken();
    const token = tokenResponse.token || tokenResponse;

    return {
      success: true,
      id: transaction.id,
      token: token,
      publicKey: process.env.FEDAPAY_PUBLIC_KEY,
      amount: amount,
      currency: 'XOF',
      description: description
    };
  } catch (error) {
    console.error('❌ Erreur création transaction FedaPay:', error);
    throw error;
  }
};

export const verifyTransaction = async (transactionId) => {
  try {
    const transaction = await initializeFedaPay().retrieve(transactionId);
    return {
      status: transaction.status
    };
  } catch (error) {
    console.error('❌ Erreur vérification transaction:', error);
    throw error;
  }
};
