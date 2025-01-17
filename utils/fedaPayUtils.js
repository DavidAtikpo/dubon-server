import { FedaPay, Transaction } from 'fedapay';

// Configuration initiale de FedaPay
const initializeFedaPay = () => {
  const environment = process.env.FEDAPAY_ENVIRONMENT || 'live';
  const apiKey = process.env.FEDAPAY_SECRET_KEY;

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
  customerId,
  callbackUrl,
  customerEmail,
  customerName
}) => {
  console.log('🔄 Début création transaction FedaPay:', {
    amount,
    description,
    customerId,
    callbackUrl,
    customerEmail,
    customerName
  });

  const baseUrl = process.env.SERVER_URL || 'https://dubon-server.onrender.com';
  const fullCallbackUrl = `${baseUrl}${callbackUrl}`;

  try {
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

    console.log('✓ Transaction créée:', { 
      id: transaction.id, 
      status: transaction.status,
      callback_url: fullCallbackUrl
    });

    // Générer le token de paiement
    const tokenResponse = await transaction.generateToken();
    const token = tokenResponse.token || tokenResponse;
    console.log('✓ Token généré:', typeof token === 'string' ? token.substring(0, 10) + '...' : 'Token non-string généré');

    // Construire l'URL de paiement
    const checkoutBaseUrl = process.env.FEDAPAY_ENVIRONMENT === 'live'
      ? 'https://checkout.fedapay.com'
      : 'https://sandbox-checkout.fedapay.com';
    
    console.log('🌐 URL de base FedaPay:', checkoutBaseUrl);
    
    const paymentUrl = `${checkoutBaseUrl}/checkout/${token}`;
    console.log('✓ URL de paiement générée:', paymentUrl);

    return {
      id: transaction.id,
      paymentUrl: paymentUrl
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
