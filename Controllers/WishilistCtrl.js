import Wishlist from '../models/wishlistModel.js';

const addToWishlist = async (req, res) => {
    const { userId, productId } = req.body;

    try {
        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [{ productId }] });
        } else {
            const productExists = wishlist.products.some(item => item.productId.equals(productId));
            if (!productExists) wishlist.products.push({ productId });
        }

        await wishlist.save();
        res.status(200).json({ success: true, message: 'Produit ajouté à la wishlist', wishlist });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

 const removeFromWishlist = async (req, res) => {
    const { userId, productId } = req.body;

    try {
        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) return res.status(404).json({ success: false, message: 'Wishlist non trouvée' });

        wishlist.products = wishlist.products.filter(item => !item.productId.equals(productId));
        await wishlist.save();

        res.status(200).json({ success: true, message: 'Produit retiré de la wishlist', wishlist });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export default {addToWishlist,removeFromWishlist}