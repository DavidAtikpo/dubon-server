'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Mettre à jour les sous-catégories pour pointer vers le bon ID de catégorie Alimentation
    await queryInterface.bulkUpdate(
      'Subcategories',
      {
        categoryId: 'df32c3a2-02ff-43b4-8a4c-61d60e6bbceb' // Nouvel ID (Alimentation)
      },
      {
        categoryId: '0b4968d0-5875-4ddf-8368-36ca724cd4be' // Ancien ID
      }
    );
  },

  async down(queryInterface, Sequelize) {
    // Restaurer l'ancien ID si nécessaire
    await queryInterface.bulkUpdate(
      'Subcategories',
      {
        categoryId: '0b4968d0-5875-4ddf-8368-36ca724cd4be' // Ancien ID
      },
      {
        categoryId: 'df32c3a2-02ff-43b4-8a4c-61d60e6bbceb' // Nouvel ID
      }
    );
  }
}; 