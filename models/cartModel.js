// models/cartModel.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Cart = sequelize.define('Cart', {
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
    }
  }, {
    timestamps: true
  });

  const CartItem = sequelize.define('CartItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    cartId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Carts',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    addedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true
  });

  // Associations
  Cart.associate = (models) => {
    Cart.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'cartOwner'
    });
    Cart.belongsToMany(models.Product, {
      through: CartItem,
      foreignKey: 'cartId',
      otherKey: 'productId',
      as: 'productsInCart'
    });
  };

  CartItem.associate = (models) => {
    CartItem.belongsTo(Cart, {
      foreignKey: 'cartId'
    });
    CartItem.belongsTo(models.Product, {
      foreignKey: 'productId'
    });
  };

  return { Cart, CartItem };
};
