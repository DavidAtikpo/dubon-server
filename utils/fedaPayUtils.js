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
  callbackUrl,
  customerEmail,
  customerName
}) => {
  try {
    // Initialiser FedaPay avant chaque transaction
    initializeFedaPay();

    console.log('Création transaction avec les données:', {
      amount,
      description,
      customerId,
      callbackUrl,
      customerEmail,
      customerName
    });

    // Créer la transaction avec la structure recommandée par FedaPay
    const transactionData = {
      amount: parseInt(amount), // Assurez-vous que le montant est un nombre
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

    const transaction = await Transaction.create(transactionData);

    console.log('Réponse FedaPay brute:', transaction);

    // Vérifier la réponse de FedaPay
    if (!transaction) {
      throw new Error('Aucune réponse de FedaPay');
    }

    // Vérifier si la transaction a été créée avec succès
    if (!transaction.id) {
      throw new Error('ID de transaction non généré par FedaPay');
    }

    // Vérifier si l'URL de paiement est disponible
    if (!transaction.payment_url) {
      throw new Error('URL de paiement non générée par FedaPay');
    }

    return {
      id: transaction.id,
      paymentUrl: transaction.payment_url,
      status: transaction.status
    };
  } catch (error) {
    console.error('Erreur détaillée FedaPay:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });

    // Construire un message d'erreur plus détaillé
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