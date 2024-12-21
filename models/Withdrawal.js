import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Withdrawal extends Model {
    static associate(models) {
      Withdrawal.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });

      Withdrawal.belongsTo(models.User, {
        foreignKey: 'processedBy',
        as: 'processor'
      });
    }
  }

  Withdrawal.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
      allowNull: false,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'XOF'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bankInfo: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING,
      unique: true
    },
    paymentProof: {
      type: DataTypes.STRING
    },
    notes: {
      type: DataTypes.TEXT
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
    requestedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    completedAt: {
      type: DataTypes.DATE
    },
    failureReason: {
      type: DataTypes.TEXT
    },
    cancellationReason: {
      type: DataTypes.TEXT
    },
    fees: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    netAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    balanceBefore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Withdrawal',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['status'] },
      { fields: ['transactionId'], unique: true },
      { fields: ['processedBy'] },
      { fields: ['requestedAt'] },
      { fields: ['completedAt'] }
    ]
  });

  return Withdrawal;
}; 