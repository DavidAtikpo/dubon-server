'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Sauvegarder les données existantes
      const existingTrainings = await queryInterface.sequelize.query(
        'SELECT * FROM "Trainings";',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      const existingParticipants = await queryInterface.sequelize.query(
        'SELECT * FROM "Participants";',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      // Supprimer d'abord la table Participants qui dépend de Trainings
      await queryInterface.dropTable('Participants');
      
      // Puis supprimer la table Trainings
      await queryInterface.dropTable('Trainings');

      // Recréer la table Trainings avec la bonne structure
      await queryInterface.createTable('Trainings', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        userId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        image: {
          type: Sequelize.STRING,
          allowNull: true
        },
        syllabus: {
          type: Sequelize.STRING,
          allowNull: true
        },
        instructor: {
          type: Sequelize.STRING,
          allowNull: true
        },
        startDate: {
          type: Sequelize.DATE,
          allowNull: true
        },
        duration: {
          type: Sequelize.STRING,
          allowNull: true
        },
        price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        participantsCount: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false
        },
        maxParticipants: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 20
        },
        category: {
          type: Sequelize.STRING,
          allowNull: true
        },
        level: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'debutant'
        },
        prerequisites: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        objectives: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('draft', 'active', 'cancelled'),
          defaultValue: 'draft',
          allowNull: false
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

      // Recréer la table Participants
      await queryInterface.createTable('Participants', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        userId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          }
        },
        trainingId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Trainings',
            key: 'id'
          }
        },
        fullName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false
        },
        phone: {
          type: Sequelize.STRING,
          allowNull: true
        },
        address: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        status: {
          type: Sequelize.STRING,
          defaultValue: 'registered',
          allowNull: false
        },
        paymentStatus: {
          type: Sequelize.STRING,
          defaultValue: 'pending',
          allowNull: false
        },
        paymentDate: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

      // Récupérer le premier utilisateur admin/formateur
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM "Users" WHERE role = 'admin' OR role = 'seller' LIMIT 1;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (users.length > 0 && existingTrainings.length > 0) {
        // Réinsérer les données avec le userId
        const trainingsWithUserId = existingTrainings.map(training => ({
          ...training,
          userId: users[0].id,
          status: training.status || 'draft'
        }));

        await queryInterface.bulkInsert('Trainings', trainingsWithUserId);

        // Réinsérer les participants
        if (existingParticipants.length > 0) {
          await queryInterface.bulkInsert('Participants', existingParticipants);
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error; // Remonter l'erreur pour que la migration échoue proprement
    }
  },

  async down(queryInterface, Sequelize) {
    // La restauration n'est pas possible car nous ne pouvons pas revenir à l'état exact précédent
    console.log('This migration cannot be undone');
  }
}; 