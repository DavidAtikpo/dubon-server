'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ServiceRequests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      serviceType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      preferredDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      preferredTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      urgency: {
        type: Sequelize.ENUM('normal', 'urgent', 'très urgent'),
        defaultValue: 'normal'
      },
      contactName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contactPhone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contactEmail: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected', 'completed'),
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ServiceRequests');
  }
}; 