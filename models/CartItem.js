import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class CartItem extends Model {
    static associate(models) {
      CartItem.belongsTo(models.Cart, {
        foreignKey: 'cartId',
        as: 'cart'
      });

      CartItem.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });

      CartItem.belongsTo(models.Service, {
        foreignKey: 'serviceId',
        as: 'service'
      });

      CartItem.belongsTo(models.Training, {
        foreignKey: 'trainingId',
        as: 'training'
      });
    }
  }

  CartItem.init({
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
    trainingId: {
      type: DataTypes.UUID,
      references: {
        model: 'Trainings',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('product', 'service', 'training'),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    selectedOptions: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    customizations: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    notes: {
      type: DataTypes.TEXT
    },
    addedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    savedForLater: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'CartItem',
    tableName: 'CartItems',
    timestamps: true,
    indexes: [
      { fields: ['cartId'] },
      { fields: ['productId'] },
      { fields: ['serviceId'] },
      { fields: ['trainingId'] },
      { fields: ['type'] },
      { fields: ['savedForLater'] }
    ]
  });

  return CartItem;
}; 