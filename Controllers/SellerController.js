import { models } from '../models/index.js';

export const getSellerProfile = async (req, res) => {
  try {
    console.log('Récupération du profil vendeur pour:', req.user.id);

    // Vérifier si le profil vendeur existe
    let sellerProfile = await models.SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    // Si le profil n'existe pas, le créer
    if (!sellerProfile) {
      console.log('Création d\'un nouveau profil vendeur');
      sellerProfile = await models.SellerProfile.create({
        userId: req.user.id,
        status: 'pending',
        verificationStatus: 'pending'
      });
    }

    // Récupérer le profil avec toutes les relations
    sellerProfile = await models.SellerProfile.findOne({
      where: { id: sellerProfile.id },
      include: [
        {
          model: models.User,
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: models.Subscription,
          where: { status: 'active' },
          required: false,
          attributes: [
            'id', 'planId', 'billingCycle', 'amount', 
            'status', 'expiresAt', 'createdAt'
          ]
        }
      ]
    });

    console.log('✅ Profil vendeur trouvé/créé');
    return res.status(200).json({
      success: true,
      data: sellerProfile
    });
  } catch (error) {
    console.error('Erreur récupération profil vendeur:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil vendeur"
    });
  }
}; 