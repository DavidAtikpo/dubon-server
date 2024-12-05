import express from'express';
import PaymentController from '../Controllers/paymentController.js';


const router = express.Router();
// Route pour créer une transaction
router.post('/:provider/create', async (req, res) => {
  try {
    const { provider } = req.params;
    let result;

    switch (provider) {
      case 'fedapay':
        result = await PaymentController.createFedaPayTransaction(req.body);
        break;

      case 'card':
        result = await PaymentController.createCardPayment(req.body);
        break;

      default:
        return res.status(400).json({ message: "Méthode de paiement non supportée" });
    }

    if (!result.success) {
      return res.status(500).json({
        message: "Erreur lors de l'initialisation du paiement",
        error: result.error
      });
    }

    res.json({ paymentUrl: result.paymentUrl });

  } catch (error) {
    console.error("Erreur de paiement:", error);
    res.status(500).json({
      message: "Erreur lors du traitement du paiement",
      error: error.message
    });
  }
});

// Route pour le callback FedaPay
router.post('/fedapay/callback', async (req, res) => {
  try {
    const result = await PaymentController.handleFedaPayCallback(req.body);
    
    if (!result.success) {
      return res.status(500).json({
        message: "Erreur lors du traitement du callback",
        error: result.error
      });
    }

    res.json({ message: result.message });
  } catch (error) {
    console.error("Erreur callback:", error);
    res.status(500).json({
      message: "Erreur lors du traitement du callback",
      error: error.message
    });
  }
});

export default router;