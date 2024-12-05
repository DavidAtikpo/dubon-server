import axios from'axios';

class PaymentController {
  async createFedaPayTransaction(paymentData) {
    try {
      // Vérification de la clé API
      if (!process.env.FEDAPAY_PRIVATE_KEY) {
        throw new Error("Clé API FedaPay non configurée");
      }

      const isSandbox = process.env.FEDAPAY_SANDBOX === 'true';
      const apiUrl = isSandbox 
        ? 'https://sandbox-api.fedapay.com/v1'
        : 'https://api.fedapay.com/v1';

      const transactionData = {
        description: `Paiement commande Dubon Services`,
        amount: paymentData.amount,
        currency: {
          iso: "XOF"
        },
        callback_url: `${process.env.FRONTEND_URL}/api/payments/fedapay/callback`,
        return_url: `${process.env.FRONTEND_URL}/checkout/success`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
        customer: {
          firstname: paymentData.customer.firstname,
          lastname: paymentData.customer.lastname,
          email: paymentData.customer.email,
          phone_number: paymentData.customer.phone
        }
      };

      console.log("Transaction Data:", transactionData);

      const config = {
        headers: {
          'Authorization': `Bearer ${process.env.FEDAPAY_PRIVATE_KEY}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.post(
        `${apiUrl}/transactions`, 
        transactionData,
        config
      );

      console.log("FedaPay Response:", response.data);

      return {
        success: true,
        paymentUrl: response.data.url
      };
    } catch (error) {
      console.error("Erreur détaillée FedaPay:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
}

export default new PaymentController();