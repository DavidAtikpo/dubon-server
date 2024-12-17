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
      }
    },
    type: {
      type: DataTypes.ENUM('individual', 'company'),
      allowNull: false
    },
    personalInfo: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
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
      }
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
      }
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
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Seller;
};
  