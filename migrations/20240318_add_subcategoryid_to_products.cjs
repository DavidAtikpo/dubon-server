'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'subcategoryId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Subcategories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Ajouter un index pour améliorer les performances
    await queryInterface.addIndex('Products', ['subcategoryId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Products', 'subcategoryId');
  }
}; 