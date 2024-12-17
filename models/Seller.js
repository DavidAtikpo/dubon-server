import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Seller = sequelize.define('Seller', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    type: {
      type: DataTypes.ENUM('individual', 'company'),
      allowNull: false,
      defaultValue: 'individual'
    },
    personalInfo: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'personal_info'
    },
    documents: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        idCard: null,
        proofOfAddress: null,
        taxCertificate: null,
        photos: [],
        rccm: null,
        companyStatutes: null
      }
    },
    contract: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        signed: false,
        signedDocument: null
      }
    },
    videoVerification: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        completed: false,
        recordingUrl: null
      },
      field: 'video_verification'
    },
    businessInfo: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        category: '',
        description: '',
        products: [],
        bankDetails: {},
        returnPolicy: ''
      },
      field: 'business_info'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'sellers'
  });

  Seller.associate = (models) => {
    Seller.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Seller;
};
  