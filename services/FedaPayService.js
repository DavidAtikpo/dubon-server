import { FedaPay, Transaction } from 'fedapay';

// Configurer FedaPay avec les clés d'API
const apiKey = process.env.FEDAPAY_SECRET_KEY;
const publicKey = process.env.FEDAPAY_PUBLIC_KEY;
const environment = process.env.FEDAPAY_ENVIRONMENT || 'live';

// Configuration de base
FedaPay.setApiKey(apiKey);
FedaPay.setEnvironment(environment);
FedaPay.setApiBase(process.env.FEDAPAY_API_URL || 'https://api.fedapay.com');

class FedaPayService {
  static async createTransaction({ amount, description, customerEmail, customerName, callbackUrl }) {
    try {
      console.log('📝 Creating FedaPay transaction with:', { 
        amount, 
        description, 
        customerEmail,
        customerName 
      });

      console.log('🔑 Using API configuration:', { 
        environment,
        apiKeyLength: apiKey?.length,
        baseUrl: FedaPay.getApiBase()
      });
      
      const baseUrl = process.env.SERVER_URL || 'https://dubon-server.onrender.com';
      const fullCallbackUrl = `${baseUrl}${callbackUrl}`;

      // Créer la transaction via l'API FedaPay
      const transaction = await Transaction.create({
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
        id: transaction.id,
        token: token,
        publicKey: publicKey,
        amount: amount,
        description: description,
        currency: 'XOF'
      };
    } catch (error) {
      console.error('❌ FedaPay transaction creation failed:', error);
      throw error;
    }
  }

  static async getTransactionStatus(transactionId) {
    try {
      const transaction = await Transaction.retrieve(transactionId);
      return transaction.status;
    } catch (error) {
      console.error('❌ Error getting transaction status:', error);
      throw error;
    }
  }
}

export default FedaPayService; 