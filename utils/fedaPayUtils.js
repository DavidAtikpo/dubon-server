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

export const createFedaPayTransaction = async ({
  amount,
  description,
  customerId,
  callbackUrl
}) => {
  try {
    // Initialiser FedaPay avant chaque transaction
    initializeFedaPay();

    // Créer la transaction avec Transaction directement
    const transaction = await Transaction.create({
      amount: amount,
      description: description,
      currency: {
        iso: 'XOF'
      },
      callback_url: callbackUrl,
      customer: {
        id: customerId
      }
    });

    console.log('Transaction créée:', transaction);

    return {
      id: transaction.id,
      paymentUrl: transaction.payment_url,
      status: transaction.status
    };
  } catch (error) {
    console.error('Erreur détaillée FedaPay:', error);
    throw new Error('Erreur lors de la création de la transaction: ' + error.message);
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