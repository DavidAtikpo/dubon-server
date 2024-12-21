import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class SellerRequest extends Model {
    static associate(models) {
      SellerRequest.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      SellerRequest.belongsTo(models.User, {
        foreignKey: 'reviewedBy',
        as: 'reviewer'
      });

      SellerRequest.hasOne(models.SellerProfile, {
        foreignKey: 'requestId',
        as: 'sellerProfile'
      });
    }
  }

  SellerRequest.init({
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
    businessName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    businessType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    registrationNumber: {
      type: DataTypes.STRING
    },
    taxId: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    website: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    documents: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    reviewedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    reviewedAt: {
      type: DataTypes.DATE
    },
    reviewNotes: {
      type: DataTypes.TEXT
    },
    rejectionReason: {
      type: DataTypes.TEXT
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'SellerRequest',
    tableName: 'SellerRequests',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['businessName'] },
      { fields: ['reviewedBy'] },
      { fields: ['reviewedAt'] }
    ]
  });

  return SellerRequest;
}; 