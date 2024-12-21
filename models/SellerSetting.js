import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class SellerSetting extends Model {
    static associate(models) {
      SellerSetting.belongsTo(models.SellerProfile, {
        foreignKey: {
          name: 'sellerId',
          allowNull: false,
          unique: true,
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        as: 'seller'
      });
    }
  }

  SellerSetting.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    storeName: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.TEXT
    },
    logoUrl: {
      type: DataTypes.STRING
    },
    bannerUrl: {
      type: DataTypes.STRING
    },
    businessHours: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    shippingMethods: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    paymentMethods: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    notifications: {
      type: DataTypes.JSONB,
      defaultValue: {
        email: true,
        sms: false,
        push: true
      }
    },
    bankInfo: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'SellerSetting',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'], unique: true }
    ]
  });

  return SellerSetting;
}; 