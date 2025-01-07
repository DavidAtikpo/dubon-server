import { FedaPay, Transaction } from 'fedapay';

// Configuration de FedaPay
const initializeFedaPay = () => {
  try {
    FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
    FedaPay.setEnvironment(process.env.NODE_ENV === 'production' ? 'live' : 'sandbox');
    FedaPay.setApiVersion('v1');
    console.log('✓ FedaPay initialisé avec succès');
  } catch (error) {
    console.error('Erreur initialisation FedaPay:', error);
    throw error;
  }
};

const getCheckoutBaseUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? 'https://checkout.fedapay.com'
    : 'https://sandbox-checkout.fedapay.com';
};

export const createFedaPayTransaction = async ({
  amount,
  description,
  customerId,
  callbackUrl,
  customerEmail,
  customerName
}) => {
  try {
    initializeFedaPay();

    console.log('Création transaction avec les données:', {
      amount,
      description,
      customerId,
      callbackUrl,
      customerEmail,
      customerName
    });

    const transactionData = {
      amount: parseInt(amount),
      description: description,
      callback_url: callbackUrl,
      currency: {
        iso: "XOF"
      },
      customer: {
        email: customerEmail,
        firstname: customerName,
      },
      custom_data: {
        customer_id: customerId
      }
    };

    console.log('Données de transaction formatées:', transactionData);

    // Créer la transaction
    const transaction = await Transaction.create(transactionData);

    console.log('Réponse FedaPay brute:', transaction);

    if (!transaction || !transaction.id) {
      throw new Error('ID de transaction non généré par FedaPay');
    }

    // Générer l'URL de paiement directement à partir de l'ID de transaction
    const paymentUrl = `${getCheckoutBaseUrl()}/payment/${transaction.id}`;

    console.log('URL de paiement générée:', paymentUrl);

    return {
      id: transaction.id,
      paymentUrl: paymentUrl,
      status: transaction.status
    };
  } catch (error) {
    console.error('Erreur détaillée FedaPay:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });

    const errorDetails = error.response?.data?.message 
      ? `${error.message}: ${error.response.data.message}`
      : error.message;

    throw new Error(`Erreur lors de la création de la transaction: ${errorDetails}`);
  }
};

export const verifyTransaction = async (transactionId) => {
  try {
    initializeFedaPay();
    const transaction = await Transaction.retrieve(transactionId);
    return {
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency.iso
    };
  } catch (error) {
    console.error('Erreur vérification FedaPay:', error);
    throw new Error('Erreur lors de la vérification de la transaction: ' + error.message);
  }
}; 