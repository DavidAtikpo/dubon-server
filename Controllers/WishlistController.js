import { models } from '../models/index.js';

// Obtenir la liste de souhaits de l'utilisateur
export const getWishlist = async (req, res) => {
  try {
    const wishlist = await models.Wishlist.findAll({
      where: { userId: req.user.id },
      include: [{
        model: models.Product,
        as: 'product'
      }]
    });
    res.json({ success: true, data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Ajouter un produit à la liste de souhaits
export const addToWishlist = async (req, res) => {
  try {
    const [wishlist, created] = await models.Wishlist.findOrCreate({
      where: {
        userId: req.user.id,
        productId: req.params.productId
      }
    });
    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Produit ajouté' : 'Produit déjà dans la liste'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Retirer un produit de la liste de souhaits
export const removeFromWishlist = async (req, res) => {
  try {
    await models.Wishlist.destroy({
      where: {
        userId: req.user.id,
        productId: req.params.productId
      }
    });
    res.json({ success: true, message: 'Produit retiré' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Vider la liste de souhaits
export const clearWishlist = async (req, res) => {
  try {
    await models.Wishlist.destroy({
      where: { userId: req.user.id }
    });
    res.json({ success: true, message: 'Liste vidée' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
}; 