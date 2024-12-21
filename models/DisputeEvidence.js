import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class DisputeEvidence extends Model {
    static associate(models) {
      DisputeEvidence.belongsTo(models.Dispute, {
        foreignKey: 'disputeId',
        as: 'dispute'
      });

      DisputeEvidence.belongsTo(models.User, {
        foreignKey: 'uploadedBy',
        as: 'uploader'
      });
    }
  }

  DisputeEvidence.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    disputeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Disputes',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('image', 'document', 'video', 'audio', 'other'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileSize: {
      type: DataTypes.INTEGER // en bytes
    },
    mimeType: {
      type: DataTypes.STRING
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    verifiedAt: {
      type: DataTypes.DATE
    },
    verifiedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    verificationNotes: {
      type: DataTypes.TEXT
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'DisputeEvidence',
    timestamps: true,
    indexes: [
      { fields: ['disputeId'] },
      { fields: ['type'] },
      { fields: ['uploadedBy'] },
      { fields: ['status'] },
      { fields: ['verifiedBy'] }
    ]
  });

  return DisputeEvidence;
}; 