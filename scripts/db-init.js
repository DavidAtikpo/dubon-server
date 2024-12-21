import { sequelize, models } from '../models/index.js';

const initDb = async () => {
  try {
    console.log('🔌 Tentative de connexion à la base de données...');
    await sequelize.authenticate();
    console.log('🚀 Début de l\'initialisation de la base de données...');

    // Réinitialiser le schéma
    await sequelize.query('DROP SCHEMA public CASCADE');
    await sequelize.query('CREATE SCHEMA public');
    console.log('✅ Schéma réinitialisé avec succès');

    // Créer les tables dans l'ordre des dépendances
    const tableOrder = [
      // 1. Tables de base (sans dépendances)
      'User',
      'Category',
      'Theme',
      'SystemSetting',
      'SystemLog',

      // 2. Tables avec dépendances utilisateur
      'UserProfile',
      'UserActivity',
      'SellerRequest',

      // 3. Tables de profil vendeur et dépendances
      'SellerProfile',
      'SellerSetting',
      'SellerStats',

      // 4. Tables de commandes et transactions (déplacé avant les produits)
      'Order',
      'Cart',

      // 5. Tables de produits et services
      'Product',
      'Service',
      'RestaurantItem',
      'Training',
      'Event',

      // 6. Tables dépendantes des commandes
      'OrderItem',
      'CartItem',
      'Payment',
      'Return',
      'Refund',

      // 7. Tables additionnelles
      'Address',
      'Promotion',
      'CustomerFilter',
      'Contract',
      'Review',
      'Rating',
      'Message',
      'Notification',
      'Withdrawal',
      'Favorite',
      'Dispute',
      'DisputeEvidence',
      'Coupon',
      'PromotionProduct'
    ];

    // Créer les tables séquentiellement
    for (const modelName of tableOrder) {
      if (models[modelName]) {
        await models[modelName].sync({ force: true });
        console.log(`✅ Table ${modelName} créée avec succès`);
      } else {
        console.warn(`⚠️ Modèle ${modelName} non trouvé`);
      }
    }

    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
};

initDb().catch(console.error);