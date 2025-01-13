import { FedaPay, Transaction } from 'fedapay';

// Configuration initiale de FedaPay
const initializeFedaPay = () => {
  const environment = process.env.FEDAPAY_ENVIRONMENT || 'sandbox';
  const apiKey = process.env.FEDAPAY_API_KEY;

  if (!apiKey) {
    throw new Error(`Clé API FedaPay ${environment} non définie`);
  }

  try {
    // Configuration de base
    FedaPay.setApiKey(apiKey);
    FedaPay.setEnvironment(environment);

    // Configuration spécifique pour le sandbox
    if (environment === 'sandbox') {
      FedaPay.setApiBase('https://sandbox-api.fedapay.com');
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

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

  try {
    const transaction = await initializeFedaPay().create({
      amount: amount,
      currency: {
        iso: 'XOF'
      },
      description: description,
      callback_url: callbackUrl,
      customer: {
        email: customerEmail,
        firstname: customerName
      }
    });

    console.log('✓ Transaction créée:', { 
      id: transaction.id, 
      status: transaction.status 
    });

    // Générer le token de paiement
    const tokenResponse = await transaction.generateToken();
    const token = tokenResponse.token || tokenResponse;
    console.log('✓ Token généré:', typeof token === 'string' ? token.substring(0, 10) + '...' : 'Token non-string généré');

    // Construire l'URL de paiement
    const baseUrl = process.env.FEDAPAY_ENVIRONMENT === 'live'
      ? 'https://checkout.fedapay.com'
      : 'https://sandbox-checkout.fedapay.com';
    
    console.log('🌐 URL de base FedaPay:', baseUrl);
    
    const paymentUrl = `${baseUrl}/checkout/${token}`;
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
