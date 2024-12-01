import FedaPay from 'fedapay';

const initiatePayment = async (req, res) => {
    const { amount, currency, customerInfo, description } = req.body;

    try {
        // Configurer la clé directement dans chaque appel
        const customer = await FedaPay.Customer.create({
            firstname: customerInfo.firstname,
            lastname: customerInfo.lastname,
            email: customerInfo.email,
            phone_number: {
                number: customerInfo.phone,
                country: 'BJ'
            }
        },{ apiKey: process.env.FEDAPAY_SECRET_KEY });

        const payment = await FedaPay.Payment.create({
            description: description || 'Achat de produit',
            amount: amount,
            currency: currency || 'XOF',
            customer: customer.id,
            callback_url: 'https://votre-site.com/paiement/confirmation',
            redirect_url: 'https://votre-site.com/paiement/success'
        }, { apiKey: process.env.FEDAPAY_SECRET_KEY });

        res.status(200).json({ success: true, url: payment.url });
    } catch (error) {
        console.error("Erreur lors de l'initialisation du paiement :", error);
        res.status(500).json({ success: false, message: "Erreur lors de la création du paiement." });
    }
};


export default { initiatePayment };
