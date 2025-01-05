import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const SellerRequest = sequelize.define('SellerRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('individual', 'company'),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    personalInfo: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    businessInfo: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    documents: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    compliance: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    contract: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    videoVerification: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'SellerRequests',
    timestamps: true
  });

  SellerRequest.associate = (models) => {
    SellerRequest.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return SellerRequest;
};
