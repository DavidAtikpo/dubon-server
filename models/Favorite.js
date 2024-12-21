import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Favorite extends Model {
    static associate(models) {
      Favorite.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Favorite.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });

      Favorite.belongsTo(models.Service, {
        foreignKey: 'serviceId',
        as: 'service'
      });

      Favorite.belongsTo(models.Event, {
        foreignKey: 'eventId',
        as: 'event'
      });

      Favorite.belongsTo(models.RestaurantItem, {
        foreignKey: 'itemId',
        as: 'menuItem'
      });

      Favorite.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });
    }
  }

  Favorite.init({
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
    sellerId: {
      type: DataTypes.UUID,
      references: {
        model: 'SellerProfiles',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('product', 'service', 'event', 'restaurant', 'seller'),
      allowNull: false
    },
    collection: {
      type: DataTypes.STRING,
      defaultValue: 'default'
    },
    notes: {
      type: DataTypes.TEXT
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Favorite',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['productId'] },
      { fields: ['serviceId'] },
      { fields: ['eventId'] },
      { fields: ['itemId'] },
      { fields: ['sellerId'] },
      { fields: ['type'] },
      { fields: ['collection'] }
    ]
  });

  return Favorite;
}; 