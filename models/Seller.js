import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Seller = sequelize.define('Seller', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('individual', 'company'),
      allowNull: false
    },
    personalInfo: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        hasRequiredFields(value) {
          const required = ['fullName', 'email', 'phone', 'address'];
          for (const field of required) {
            if (!value[field]) {
              throw new Error(`${field} est requis`);
            }
          }
        }
      }
    },
    documents: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    businessInfo: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    validation: {
      type: DataTypes.JSONB,
      defaultValue: {
        status: 'pending',
        message: null,
        approvedAt: null,
        approvedBy: null
      }
    }
  }, {
    timestamps: true
  });

  return Seller;
};
  