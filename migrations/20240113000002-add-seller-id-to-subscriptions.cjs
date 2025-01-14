'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Subscriptions', 'sellerId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'SellerProfiles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Créer un index pour améliorer les performances des requêtes
    await queryInterface.addIndex('Subscriptions', ['sellerId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Subscriptions', ['sellerId']);
    await queryInterface.removeColumn('Subscriptions', 'sellerId');
  }
}; 