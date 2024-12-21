import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Coupon extends Model {
    static associate(models) {
      Coupon.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });

      Coupon.belongsToMany(models.Product, {
        through: 'CouponProducts',
        foreignKey: 'couponId',
        as: 'products'
      });
    }
  }

  Coupon.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'SellerProfiles',
        key: 'id'
      }
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('percentage', 'fixed_amount'),
      allowNull: false
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE
    },
    minPurchase: {
      type: DataTypes.DECIMAL(10, 2)
    },
    maxDiscount: {
      type: DataTypes.DECIMAL(10, 2)
    },
    usageLimit: {
      type: DataTypes.INTEGER
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    perCustomerLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    applicableProducts: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: []
    },
    excludedProducts: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: []
    },
    applicableCategories: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    customerGroups: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'expired'),
      defaultValue: 'active'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Coupon',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['code'], unique: true },
      { fields: ['status'] },
      { fields: ['startDate'] },
      { fields: ['endDate'] }
    ]
  });

  return Coupon;
}; 