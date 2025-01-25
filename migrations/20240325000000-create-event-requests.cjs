'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EventRequests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      eventId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      requestedDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      guestCount: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      preferences: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      specialRequests: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Ajouter les index pour améliorer les performances
    await queryInterface.addIndex('EventRequests', ['eventId']);
    await queryInterface.addIndex('EventRequests', ['userId']);
    await queryInterface.addIndex('EventRequests', ['status']);
    await queryInterface.addIndex('EventRequests', ['email']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('EventRequests');
  }
}; 