'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EventRequest extends Model {
    static associate(models) {
      EventRequest.belongsTo(models.Event, {
        foreignKey: 'eventId',
        as: 'event'
      });
    }
  }

  EventRequest.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Events',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    requestedDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    guestCount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    preferences: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'EventRequest',
  });

  return EventRequest;
}; 