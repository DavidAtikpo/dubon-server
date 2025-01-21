'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('Trainings');
      
      if (!tableInfo.userId) {
        // D'abord, ajouter la colonne comme nullable
        await queryInterface.addColumn('Trainings', 'userId', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        });

        // Récupérer le premier utilisateur admin/formateur
        const users = await queryInterface.sequelize.query(
          `SELECT id FROM "Users" WHERE role = 'admin' OR role = 'seller' LIMIT 1;`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        if (users.length > 0) {
          // Mettre à jour les formations existantes avec cet utilisateur
          await queryInterface.sequelize.query(
            `UPDATE "Trainings" SET "userId" = :userId WHERE "userId" IS NULL`,
            {
              replacements: { userId: users[0].id },
              type: queryInterface.sequelize.QueryTypes.UPDATE
            }
          );
        }

        // Maintenant rendre la colonne non nullable
        await queryInterface.changeColumn('Trainings', 'userId', {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('Trainings');
      
      if (tableInfo.userId) {
        await queryInterface.removeColumn('Trainings', 'userId');
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  }
}; 