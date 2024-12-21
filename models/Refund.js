import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Refund extends Model {
    static associate(models) {
      Refund.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });

      Refund.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Refund.belongsTo(models.Return, {
        foreignKey: 'returnId',
        as: 'return'
      });

      Refund.belongsTo(models.User, {
        foreignKey: 'processedBy',
        as: 'processor'
      });
    }
  }

  Refund.init({
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    returnId: {
      type: DataTypes.UUID,
      references: {
        model: 'Returns',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('full', 'partial'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    refundMethod: {
      type: DataTypes.STRING,
      allowNull: false
    },
    paymentDetails: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    transactionId: {
      type: DataTypes.STRING
    },
    processedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    processedAt: {
      type: DataTypes.DATE
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
    modelName: 'Refund',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['userId'] },
      { fields: ['returnId'] },
      { fields: ['status'] },
      { fields: ['processedBy'] },
      { fields: ['transactionId'] }
    ]
  });

  return Refund;
}; 