import { FedaPay, Transaction } from 'fedapay';

// Configurer FedaPay avec les clés d'API
const apiKey = process.env.FEDAPAY_API_KEY;
const environment = 'live';

// Configuration de base
FedaPay.setApiKey(apiKey);
FedaPay.setEnvironment(environment);
FedaPay.setApiBase('https://api.fedapay.com');

class FedaPayService {
  static async createTransfer({ amount, bankInfo, description, currency = 'XOF' }) {
    try {
      console.log('📝 Creating FedaPay transfer with:', { amount, bankInfo, description });
      console.log('🔑 Using API configuration:', { 
        environment,
        apiKeyLength: apiKey?.length,
        baseUrl: FedaPay.getApiBase()
      });
      
      // Créer le transfert via l'API FedaPay
      const transfer = await Transaction.create({
        amount: amount,
        currency: currency,
        description: description,
        bank_account: {
          holder_name: bankInfo.accountName,
          bank_name: bankInfo.bankName,
          account_number: bankInfo.accountNumber,
          swift_code: bankInfo.swiftCode || null,
          country: 'BJ' // Code pays pour le Bénin
        },
        mode: 'bank_transfer'
      });

      console.log('✅ FedaPay transfer created:', transfer.id);
      return transfer;
    } catch (error) {
      console.error('❌ FedaPay transfer creation failed:', error);
      throw error;
    }
  }

  static async getTransferStatus(transferId) {
    try {
      const transfer = await Transaction.retrieve(transferId);
      return transfer.status;
    } catch (error) {
      console.error('❌ Error getting transfer status:', error);
      throw error;
    }
  }
}

export default FedaPayService; 