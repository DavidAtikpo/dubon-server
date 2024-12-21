import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class SellerProfile extends Model {
    static associate(models) {
      SellerProfile.belongsTo(models.User, {
        foreignKey: {
          name: 'userId',
          allowNull: false,
          unique: true,
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        as: 'user'
      });

      SellerProfile.belongsTo(models.SellerRequest, {
        foreignKey: {
          name: 'requestId',
          allowNull: true,
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        as: 'request'
      });

      SellerProfile.hasOne(models.SellerSetting, {
        foreignKey: 'sellerId',
        as: 'settings'
      });

      SellerProfile.hasOne(models.SellerStats, {
        foreignKey: 'sellerId',
        as: 'stats'
      });

      SellerProfile.hasMany(models.Product, {
        foreignKey: 'sellerId',
        as: 'products'
      });

      SellerProfile.hasMany(models.Service, {
        foreignKey: 'sellerId',
        as: 'services'
      });
    }
  }

  SellerProfile.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    storeName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    logo: {
      type: DataTypes.STRING
    },
    banner: {
      type: DataTypes.STRING
    },
    businessInfo: {
      type: DataTypes.JSONB,
      defaultValue: {
        registrationNumber: null,
        taxId: null,
        businessType: null,
        yearEstablished: null
      }
    },
    contactInfo: {
      type: DataTypes.JSONB,
      defaultValue: {
        email: null,
        phone: null,
        whatsapp: null,
        address: {}
      }
    },
    bankInfo: {
      type: DataTypes.JSONB,
      defaultValue: {
        bankName: null,
        accountNumber: null,
        accountName: null,
        swift: null
      }
    },
    businessHours: {
      type: DataTypes.JSONB,
      defaultValue: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '09:00', close: '13:00' },
        sunday: { closed: true }
      }
    },
    location: {
      type: DataTypes.JSONB,
      defaultValue: {
        latitude: null,
        longitude: null,
        address: null,
        city: null,
        country: null
      }
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    commissionRate: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    features: {
      type: DataTypes.JSONB,
      defaultValue: {
        hasDelivery: false,
        hasPickup: true,
        acceptsReturns: true,
        minimumOrder: 0
      }
    },
    socialMedia: {
      type: DataTypes.JSONB,
      defaultValue: {
        facebook: null,
        instagram: null,
        twitter: null,
        website: null
      }
    }
  }, {
    sequelize,
    modelName: 'SellerProfile',
    tableName: 'SellerProfiles',
    timestamps: true,
    indexes: [
      { fields: ['userId'], unique: true },
      { fields: ['storeName'], unique: true },
      { fields: ['slug'], unique: true },
      { fields: ['status'] },
      { fields: ['verificationStatus'] }
    ]
  });

  return SellerProfile;
};
  