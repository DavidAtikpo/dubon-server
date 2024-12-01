import client from '../config/paypal.js';

export const createOrder = async (req, res) => {
    const { amount, currency } = req.body;

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: currency || 'XOF',
                value: amount
            }
        }]
    });

    try {
        const order = await client.execute(request);
        res.status(200).json({ success: true, id: order.result.id });
    } catch (error) {
        console.error("Erreur lors de la création de la commande PayPal :", error);
        res.status(500).json({ success: false, message: "Erreur lors de la création de la commande." });
    }
};

export const captureOrder = async (req, res) => {
    const { orderID } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try {
        const capture = await client.execute(request);
        res.status(200).json({ success: true, details: capture.result });
    } catch (error) {
        console.error("Erreur lors de la capture de la commande PayPal :", error);
        res.status(500).json({ success: false, message: "Erreur lors de la capture de la commande." });
    }
};
