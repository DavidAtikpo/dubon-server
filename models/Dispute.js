import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Dispute extends Model {
    static associate(models) {
      Dispute.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });

      Dispute.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Dispute.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });

      Dispute.hasMany(models.DisputeEvidence, {
        foreignKey: 'disputeId',
        as: 'evidences'
      });

      Dispute.belongsTo(models.User, {
        foreignKey: 'resolvedBy',
        as: 'resolver'
      });
    }
  }

  Dispute.init({
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
    type: {
      type: DataTypes.ENUM('product', 'service', 'delivery', 'payment', 'other'),
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
      defaultValue: 'open'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    desiredOutcome: {
      type: DataTypes.TEXT
    },
    resolution: {
      type: DataTypes.TEXT
    },
    resolvedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    resolvedAt: {
      type: DataTypes.DATE
    },
    dueDate: {
      type: DataTypes.DATE
    },
    escalatedAt: {
      type: DataTypes.DATE
    },
    escalationReason: {
      type: DataTypes.TEXT
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Dispute',
    tableName: 'Disputes',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['userId'] },
      { fields: ['sellerId'] },
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['resolvedBy'] },
      { fields: ['dueDate'] }
    ]
  });

  return Dispute;
}; 