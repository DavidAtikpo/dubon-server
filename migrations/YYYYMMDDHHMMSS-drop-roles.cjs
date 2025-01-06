'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Supprimer d'abord la table de jointure
    await queryInterface.dropTable('UserRoles');
    
    // Puis supprimer la table Roles
    await queryInterface.dropTable('Roles');
  },

  async down(queryInterface, Sequelize) {
    // La restauration n'est pas nécessaire car nous supprimons définitivement
  }
}; 