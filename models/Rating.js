// models/Rating.js

import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Rating extends Model {
    static associate(models) {
      Rating.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Rating.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });

      Rating.belongsTo(models.Service, {
        foreignKey: 'serviceId',
        as: 'service'
      });

      Rating.belongsTo(models.Event, {
        foreignKey: 'eventId',
        as: 'event'
      });

      Rating.belongsTo(models.RestaurantItem, {
        foreignKey: 'itemId',
        as: 'menuItem'
      });
    }
  }

  Rating.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.UUID,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    serviceId: {
      type: DataTypes.UUID,
      references: {
        model: 'Services',
        key: 'id'
      }
    },
    eventId: {
      type: DataTypes.UUID,
      references: {
        model: 'Events',
        key: 'id'
      }
    },
    itemId: {
      type: DataTypes.UUID,
      references: {
        model: 'RestaurantItems',
        key: 'id'
      }
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT
    },
    orderId: {
      type: DataTypes.UUID,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    verifiedPurchase: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Rating',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['productId'] },
      { fields: ['serviceId'] },
      { fields: ['eventId'] },
      { fields: ['itemId'] },
      { fields: ['orderId'] },
      { fields: ['status'] }
    ]
  });

  return Rating;
};
