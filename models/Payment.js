import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });

      Payment.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Payment.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });
    }
  }

  Payment.init({
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
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'SellerProfiles',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'XOF'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false
    },
    paymentProvider: {
      type: DataTypes.STRING,
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    paymentDetails: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    errorMessage: {
      type: DataTypes.TEXT
    },
    processedAt: {
      type: DataTypes.DATE
    },
    refundedAt: {
      type: DataTypes.DATE
    },
    refundReason: {
      type: DataTypes.TEXT
    },
    refundTransactionId: {
      type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'Payment',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['userId'] },
      { fields: ['sellerId'] },
      { fields: ['transactionId'] },
      { fields: ['status'] },
      { fields: ['createdAt'] }
    ]
  });

  return Payment;
}; 