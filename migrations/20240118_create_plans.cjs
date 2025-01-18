const up = async (queryInterface, Sequelize) => {
  // Créer la table Plans
  await queryInterface.createTable('Plans', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    monthlyPrice: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    annualPrice: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    features: {
      type: Sequelize.JSONB,
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Insérer les plans par défaut
  await queryInterface.bulkInsert('Plans', [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Pour démarrer votre activité',
      monthlyPrice: 5000,
      annualPrice: 50000,
      features: JSON.stringify([
        'Jusqu\'à 50 produits',
        'Support client standard',
        'Statistiques de base',
        'Une seule boutique'
      ])
    },
    {
      id: 'standard',
      name: 'Standard',
      description: 'Pour les entreprises en croissance',
      monthlyPrice: 15000,
      annualPrice: 150000,
      features: JSON.stringify([
        'Jusqu\'à 200 produits',
        'Support client prioritaire',
        'Statistiques avancées',
        'Jusqu\'à 2 boutiques',
        'Marketing automation'
      ])
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Pour les entreprises établies',
      monthlyPrice: 30000,
      annualPrice: 300000,
      features: JSON.stringify([
        'Produits illimités',
        'Support client VIP',
        'Statistiques premium',
        'Boutiques illimitées',
        'Marketing automation',
        'API accès',
        'Account manager dédié'
      ])
    }
  ]);
};

const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('Plans');
};

export { up, down }; 