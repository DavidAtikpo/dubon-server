import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const DeliveryPerson = sequelize.define('DeliveryPerson', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    vehicleType: {
      type: DataTypes.ENUM('bike', 'motorcycle', 'car', 'van'),
      allowNull: false
    },
    vehicleNumber: {
      type: DataTypes.STRING
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('available', 'busy', 'offline'),
      defaultValue: 'offline'
    },
    currentLocation: {
      type: DataTypes.JSONB,
      defaultValue: null
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    deliveryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    documents: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    zone: {
      type: DataTypes.STRING
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'DeliveryPersons'
  });

  DeliveryPerson.associate = (models) => {
    DeliveryPerson.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    DeliveryPerson.hasMany(models.Order, {
      foreignKey: 'deliveryPersonId',
      as: 'orders'
    });
  };

  return DeliveryPerson;
}; 