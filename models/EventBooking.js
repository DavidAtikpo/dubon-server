import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const EventBooking = sequelize.define('EventBooking', {
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
    numberOfGuests: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
      defaultValue: 'pending'
    },
    specialRequests: {
      type: DataTypes.TEXT
    },
    selectedServices: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded'),
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.STRING
    },
    contactInfo: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    cancellationReason: {
      type: DataTypes.TEXT
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2)
    }
  });

  EventBooking.associate = (models) => {
    EventBooking.belongsTo(models.Event, {
      foreignKey: 'eventId',
      as: 'event'
    });

    EventBooking.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    EventBooking.hasOne(models.Payment, {
      foreignKey: 'bookingId',
      as: 'payment'
    });
  };

  return EventBooking;
}; 