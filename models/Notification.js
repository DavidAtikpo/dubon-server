import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Notification.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });

      Notification.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
    }
  }

  Notification.init({
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
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM(
        'order',
        'payment',
        'delivery',
        'product',
        'account',
        'promotion',
        'system'
      ),
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE
    },
    orderId: {
      type: DataTypes.UUID,
      references: {
        model: 'Orders',
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
    action: {
      type: DataTypes.STRING
    },
    actionData: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    icon: {
      type: DataTypes.STRING
    },
    expiresAt: {
      type: DataTypes.DATE
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Notification',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['type'] },
      { fields: ['isRead'] },
      { fields: ['priority'] },
      { fields: ['orderId'] },
      { fields: ['createdAt'] }
    ]
  });

  return Notification;
}; 