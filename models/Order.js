import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'customer'
      });

      Order.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });

      Order.belongsToMany(models.Product, {
        through: 'OrderItems',
        foreignKey: 'orderId',
        as: 'products'
      });

      Order.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'items'
      });

      Order.hasOne(models.Payment, {
        foreignKey: 'orderId',
        as: 'payment'
      });

      Order.hasMany(models.Return, {
        foreignKey: 'orderId',
        as: 'returns'
      });

      Order.hasMany(models.Refund, {
        foreignKey: 'orderId',
        as: 'refunds'
      });

      Order.hasMany(models.Dispute, {
        foreignKey: 'orderId',
        as: 'disputes'
      });
    }
  }

  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'SellerProfiles',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('product', 'service', 'training', 'mixed'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded'
      ),
      defaultValue: 'pending'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    shipping: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'XOF'
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false
    },
    shippingMethod: {
      type: DataTypes.STRING,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT
    },
    customerNotes: {
      type: DataTypes.TEXT
    },
    sellerNotes: {
      type: DataTypes.TEXT
    },
    cancelReason: {
      type: DataTypes.TEXT
    },
    cancelledAt: {
      type: DataTypes.DATE
    },
    confirmedAt: {
      type: DataTypes.DATE
    },
    processedAt: {
      type: DataTypes.DATE
    },
    shippedAt: {
      type: DataTypes.DATE
    },
    deliveredAt: {
      type: DataTypes.DATE
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'Orders',
    timestamps: true,
    indexes: [
      { fields: ['orderNumber'], unique: true },
      { fields: ['userId'] },
      { fields: ['sellerId'] },
      { fields: ['status'] },
      { fields: ['type'] },
      { fields: ['createdAt'] }
    ]
  });

  return Order;
};