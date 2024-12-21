import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Address extends Model {
    static associate(models) {
      Address.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Address.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });
    }
  }

  Address.init({
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
      references: {
        model: 'SellerProfiles',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('shipping', 'billing', 'both', 'store'),
      defaultValue: 'both'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    label: {
      type: DataTypes.STRING
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    company: {
      type: DataTypes.STRING
    },
    address1: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address2: {
      type: DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING
    },
    postalCode: {
      type: DataTypes.STRING
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    instructions: {
      type: DataTypes.TEXT
    },
    coordinates: {
      type: DataTypes.JSONB,
      defaultValue: {
        latitude: null,
        longitude: null
      }
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'failed'),
      defaultValue: 'pending'
    },
    verifiedAt: {
      type: DataTypes.DATE
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Address',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['sellerId'] },
      { fields: ['type'] },
      { fields: ['isDefault'] },
      { fields: ['verificationStatus'] }
    ]
  });

  return Address;
}; 