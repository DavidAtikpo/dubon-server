import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const EventRequest = sequelize.define('EventRequest', {
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
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
  });

  EventRequest.associate = (models) => {
    EventRequest.belongsTo(models.Event, {
      foreignKey: 'eventId',
      as: 'event'
    });
    EventRequest.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return EventRequest;
}; 