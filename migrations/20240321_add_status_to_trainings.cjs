'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Vérifier si la colonne existe déjà
      const tableInfo = await queryInterface.describeTable('Trainings');
      
      if (!tableInfo.status) {
        await queryInterface.addColumn('Trainings', 'status', {
          type: Sequelize.ENUM('draft', 'active', 'cancelled'),
          defaultValue: 'draft',
          allowNull: false
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('Trainings');
      
      if (tableInfo.status) {
        await queryInterface.removeColumn('Trainings', 'status');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Trainings_status";');
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  }
}; 