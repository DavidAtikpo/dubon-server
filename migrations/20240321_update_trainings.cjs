'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Récupérer le premier utilisateur admin/formateur
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM "Users" WHERE role = 'admin' OR role = 'seller' LIMIT 1;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (users.length > 0) {
        // Ajouter la colonne userId si elle n'existe pas
        const tableInfo = await queryInterface.describeTable('Trainings');
        if (!tableInfo.userId) {
          await queryInterface.addColumn('Trainings', 'userId', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'Users',
              key: 'id'
            }
          });

          // Mettre à jour tous les enregistrements existants avec l'ID du premier admin/formateur
          await queryInterface.sequelize.query(
            `UPDATE "Trainings" SET "userId" = :userId WHERE "userId" IS NULL`,
            {
              replacements: { userId: users[0].id },
              type: queryInterface.sequelize.QueryTypes.UPDATE
            }
          );

          // Rendre la colonne non nullable
          await queryInterface.changeColumn('Trainings', 'userId', {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'Users',
              key: 'id'
            }
          });
        }

        // Ajouter la colonne status si elle n'existe pas
        if (!tableInfo.status) {
          await queryInterface.sequelize.query(
            `CREATE TYPE "enum_Trainings_status" AS ENUM ('draft', 'active', 'cancelled')`
          ).catch(() => {
            console.log('Type enum_Trainings_status already exists');
          });

          await queryInterface.addColumn('Trainings', 'status', {
            type: Sequelize.ENUM('draft', 'active', 'cancelled'),
            defaultValue: 'draft',
            allowNull: false
          });
        }

        // Mettre à jour la colonne participantsCount si elle existe
        if (tableInfo.enrolledCount && !tableInfo.participantsCount) {
          await queryInterface.renameColumn('Trainings', 'enrolledCount', 'participantsCount');
        } else if (!tableInfo.participantsCount) {
          await queryInterface.addColumn('Trainings', 'participantsCount', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
          });
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('Trainings');
      
      if (tableInfo.participantsCount) {
        await queryInterface.removeColumn('Trainings', 'participantsCount');
      }
      
      if (tableInfo.status) {
        await queryInterface.removeColumn('Trainings', 'status');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Trainings_status"');
      }
      
      if (tableInfo.userId) {
        await queryInterface.removeColumn('Trainings', 'userId');
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  }
}; 