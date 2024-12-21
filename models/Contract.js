import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Contract extends Model {
    static associate(models) {
      Contract.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Contract.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });

      Contract.belongsTo(models.User, {
        foreignKey: 'approvedBy',
        as: 'approver'
      });

      Contract.belongsTo(models.SellerRequest, {
        foreignKey: 'requestId',
        as: 'sellerRequest'
      });
    }
  }

  Contract.init({
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
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'SellerProfiles',
        key: 'id'
      }
    },
    requestId: {
      type: DataTypes.UUID,
      references: {
        model: 'SellerRequests',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('seller', 'service', 'partnership'),
      allowNull: false
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    terms: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'active', 'expired', 'terminated'),
      defaultValue: 'draft'
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    paymentTerms: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    signatures: {
      type: DataTypes.JSONB,
      defaultValue: {
        user: null,
        seller: null,
        admin: null
      }
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    approvedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE
    },
    terminationReason: {
      type: DataTypes.TEXT
    },
    terminatedAt: {
      type: DataTypes.DATE
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Contract',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['sellerId'] },
      { fields: ['requestId'] },
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['startDate'] },
      { fields: ['endDate'] },
      { fields: ['approvedBy'] }
    ]
  });

  return Contract;
}; 