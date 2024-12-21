import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Cart extends Model {
    static associate(models) {
      Cart.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      Cart.belongsToMany(models.Product, {
        through: 'CartItems',
        foreignKey: 'cartId',
        as: 'products'
      });

      Cart.hasMany(models.CartItem, {
        foreignKey: 'cartId',
        as: 'items'
      });
    }
  }

  Cart.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'merged', 'converted', 'abandoned'),
      defaultValue: 'active'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
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
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'XOF'
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      defaultValue: null
    },
    selectedShippingMethod: {
      type: DataTypes.STRING
    },
    selectedPaymentMethod: {
      type: DataTypes.STRING
    },
    couponCode: {
      type: DataTypes.STRING
    },
    notes: {
      type: DataTypes.TEXT
    },
    lastActivity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expiresAt: {
      type: DataTypes.DATE
    },
    convertedToOrderId: {
      type: DataTypes.UUID,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Cart',
    tableName: 'Carts',
    timestamps: true,
    indexes: [
      { fields: ['userId'], unique: true },
      { fields: ['status'] },
      { fields: ['couponCode'] },
      { fields: ['lastActivity'] },
      { fields: ['expiresAt'] },
      { fields: ['convertedToOrderId'] }
    ]
  });

  return Cart;
}; 