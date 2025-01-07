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

    // 1. Créer la transaction
    const transaction = await Transaction.create({
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
    });

    if (!transaction || !transaction.id) {
      throw new Error('ID de transaction non généré par FedaPay');
    }

    // 2. Générer le token en utilisant la méthode correcte
    const tokenResponse = await Transaction.prototype.generateToken.call(transaction);
    const token = tokenResponse.token;

    // 3. Construire l'URL de paiement
    const paymentUrl = `${getCheckoutBaseUrl()}/checkout/${token}`;

    console.log('URL de paiement générée:', paymentUrl);

    return {
      id: transaction.id,
      paymentUrl: paymentUrl,
      status: transaction.status
    };
  } catch (error) {
    console.error('Erreur détaillée FedaPay:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
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