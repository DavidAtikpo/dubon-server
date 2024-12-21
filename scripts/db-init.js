import { sequelize, models } from '../models/index.js';

const initDb = async () => {
  try {
    console.log('🔌 Tentative de connexion à la base de données...');
    await sequelize.authenticate();
    console.log('🚀 Début de l\'initialisation de la base de données...');

    // Réinitialiser le schéma
    await sequelize.query('DROP SCHEMA public CASCADE');
    await sequelize.query('CREATE SCHEMA public');
    await sequelize.query('GRANT ALL ON SCHEMA public TO public');
    console.log('✅ Schéma réinitialisé avec succès');

    // Créer les tables dans l'ordre des dépendances
    const tableOrder = [
      // 1. Tables fondamentales (sans dépendances)
      'User',
      'Category',
      'Theme',
      'SystemSetting',
      'SystemLog',
      'SellerRequest',

      // 2. Tables avec dépendances utilisateur
      'UserProfile',
      'UserActivity',
      'SellerProfile',

      // 3. Tables dépendantes du profil vendeur
      'SellerSetting',
      'SellerStats',

      // 4. Tables de base pour les transactions
      'Cart',
      'Order',

      // 5. Tables de produits et services
      'Product',
      'Service',
      'RestaurantItem',
      'Training',
      'Event',
      'Promotion',

      // 6. Tables de jonction et dépendantes
      'CartItem',
      'OrderItem',
      'PromotionProduct',

      // 7. Tables de transactions
      'Payment',
      'Return',
      'Refund',

      // 8. Tables additionnelles
      'Address',
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
      'Coupon'
    ];

    // Créer les tables séquentiellement avec gestion des erreurs
    for (const modelName of tableOrder) {
      try {
        if (models[modelName]) {
          await models[modelName].sync({ force: true });
          console.log(`✅ Table ${modelName} créée avec succès`);
        } else {
          console.warn(`⚠️ Modèle ${modelName} non trouvé`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la création de la table ${modelName}:`, error);
        throw error;
      }
    }

    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
};

initDb().catch(error => {
  console.error('❌ Erreur fatale lors de l\'initialisation:', error);
  process.exit(1);
});