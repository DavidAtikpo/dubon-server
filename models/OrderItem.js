import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });

      OrderItem.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });

      OrderItem.belongsTo(models.Service, {
        foreignKey: 'serviceId',
        as: 'service'
      });

      OrderItem.belongsTo(models.Training, {
        foreignKey: 'trainingId',
        as: 'training'
      });
    }
  }

  OrderItem.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
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
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
      defaultValue: 'pending'
    },
    customizations: {
      type: DataTypes.JSONB,
      defaultValue: {}
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
    modelName: 'OrderItem',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['productId'] },
      { fields: ['serviceId'] },
      { fields: ['trainingId'] },
      { fields: ['type'] },
      { fields: ['status'] }
    ]
  });

  return OrderItem;
}; 