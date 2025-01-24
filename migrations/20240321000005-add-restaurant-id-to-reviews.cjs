'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('Reviews', 'restaurantId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Restaurants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Colonne restaurantId ajoutée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la colonne:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('Reviews', 'restaurantId');
      console.log('✅ Colonne restaurantId supprimée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la colonne:', error);
      throw error;
    }
  }
}; 