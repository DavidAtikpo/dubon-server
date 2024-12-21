import Cart from '../models/Cart.js';

 const addToCart = async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [{ productId, quantity }] });
        } else {
            const product = cart.items.find(item => item.productId.equals(productId));
            if (product) {
                product.quantity += quantity;
            } else {
                cart.items.push({ productId, quantity });
            }
        }

        await cart.save();
        res.status(200).json({ success: true, message: 'Produit ajouté au panier', cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

 const removeFromCart = async (req, res) => {
    const { userId, productId } = req.body;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ success: false, message: 'Panier non trouvé' });

        cart.items = cart.items.filter(item => !item.productId.equals(productId));
        await cart.save();

        res.status(200).json({ success: true, message: 'Produit retiré du panier', cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

 const updateCartQuantity = async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ success: false, message: 'Panier non trouvé' });

        const product = cart.items.find(item => item.productId.equals(productId));
        if (product) {
            product.quantity = quantity;
            await cart.save();
            res.status(200).json({ success: true, message: 'Quantité mise à jour', cart });
        } else {
            res.status(404).json({ success: false, message: 'Produit non trouvé dans le panier' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};


export default {addToCart,removeFromCart,updateCartQuantity}