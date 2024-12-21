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

    // Désactiver temporairement les contraintes de clé étrangère
    await sequelize.query('SET CONSTRAINTS ALL DEFERRED');

    // Créer les tables dans l'ordre des dépendances
    const tableOrder = [
      // 1. Tables fondamentales (sans dépendances)
      { name: 'User', tableName: 'Users' },
      { name: 'Category', tableName: 'Categories' },
      { name: 'Theme', tableName: 'Themes' },
      { name: 'SystemSetting', tableName: 'SystemSettings' },
      { name: 'SystemLog', tableName: 'SystemLogs' },
      { name: 'SellerRequest', tableName: 'SellerRequests' },

      // 2. Tables avec dépendances utilisateur
      { name: 'UserProfile', tableName: 'UserProfiles' },
      { name: 'UserActivity', tableName: 'UserActivities' },
      { name: 'SellerProfile', tableName: 'SellerProfiles' },

      // 3. Tables dépendantes du profil vendeur
      { name: 'SellerSetting', tableName: 'SellerSettings' },
      { name: 'SellerStats', tableName: 'SellerStats' },

      // 4. Tables de base pour les transactions
      { name: 'Cart', tableName: 'Carts' },
      { name: 'Order', tableName: 'Orders' },

      // 5. Tables de produits et services
      { name: 'Product', tableName: 'Products' },
      { name: 'Service', tableName: 'Services' },
      { name: 'RestaurantItem', tableName: 'RestaurantItems' },
      { name: 'Training', tableName: 'Trainings' },
      { name: 'Event', tableName: 'Events' },
      { name: 'Promotion', tableName: 'Promotions' },

      // 6. Tables de jonction et dépendantes
      { name: 'CartItem', tableName: 'CartItems' },
      { name: 'OrderItem', tableName: 'OrderItems' },
      { name: 'PromotionProduct', tableName: 'PromotionProducts' },

      // 7. Tables de transactions
      { name: 'Payment', tableName: 'Payments' },
      { name: 'Return', tableName: 'Returns' },
      { name: 'Refund', tableName: 'Refunds' },

      // 8. Tables additionnelles
      { name: 'Address', tableName: 'Addresses' },
      { name: 'CustomerFilter', tableName: 'CustomerFilters' },
      { name: 'Contract', tableName: 'Contracts' },
      { name: 'Review', tableName: 'Reviews' },
      { name: 'Rating', tableName: 'Ratings' },
      { name: 'Message', tableName: 'Messages' },
      { name: 'Notification', tableName: 'Notifications' },
      { name: 'Withdrawal', tableName: 'Withdrawals' },
      { name: 'Favorite', tableName: 'Favorites' },
      { name: 'Dispute', tableName: 'Disputes' },
      { name: 'DisputeEvidence', tableName: 'DisputeEvidences' },
      { name: 'Coupon', tableName: 'Coupons' }
    ];

    // Créer les tables séquentiellement
    for (const { name, tableName } of tableOrder) {
      try {
        if (models[name]) {
          // Vérifier si la table existe déjà
          const tableExists = await sequelize.getQueryInterface().showAllTables()
            .then(tables => tables.includes(tableName.toLowerCase()));

          if (tableExists) {
            await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
          }

          await models[name].sync({ force: true });
          console.log(`✅ Table ${tableName} créée avec succès`);
        } else {
          console.warn(`⚠️ Modèle ${name} non trouvé`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la création de la table ${tableName}:`, error);
        throw error;
      }
    }

    // Réactiver les contraintes de clé étrangère
    await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE');

    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
};

// Gestion des erreurs améliorée
initDb().catch(error => {
  console.error('❌ Erreur fatale lors de l\'initialisation:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});