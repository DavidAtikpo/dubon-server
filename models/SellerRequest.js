import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class SellerRequest extends Model {}

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
    type: {
      type: DataTypes.ENUM('individual', 'company'),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'approved', 'rejected']]
      }
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
    sequelize,
    modelName: 'SellerRequest',
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
