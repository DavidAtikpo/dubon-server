import { FedaPay, Transaction } from 'fedapay';

// Configuration initiale de FedaPay
const initializeFedaPay = () => {
  const environment = process.env.NODE_ENV === 'production' ? 'live' : 'sandbox';
  const apiKey = process.env.NODE_ENV === 'production' 
    ? process.env.FEDAPAY_LIVE_SECRET_KEY 
    : process.env.FEDAPAY_TEST_SECRET_KEY;

  if (!apiKey) {
    throw new Error(`Clé API FedaPay ${environment} non définie`);
  }

  try {
    FedaPay.setApiKey(apiKey);
    FedaPay.setEnvironment(environment);
    console.log('🔧 Configuration FedaPay:', { 
      environment, 
      apiVersion: 'v1',
      keyLength: apiKey.length 
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
    const token = await transaction.generateToken();
    console.log('✓ Token généré:', token.substring(0, 10) + '...');

    // Construire l'URL de paiement
    const baseUrl = process.env.NODE_ENV === 'production'
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
