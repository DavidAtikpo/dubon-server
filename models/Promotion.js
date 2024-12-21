import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Promotion extends Model {
    static associate(models) {
      Promotion.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });

      Promotion.belongsToMany(models.Product, {
        through: 'PromotionProducts',
        foreignKey: 'promotionId',
        as: 'products'
      });

      Promotion.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
    }
  }

  Promotion.init({
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    type: {
      type: DataTypes.ENUM('percentage', 'fixed_amount', 'buy_x_get_y', 'bundle'),
      allowNull: false
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    conditions: {
      type: DataTypes.JSONB,
      defaultValue: {}
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
    status: {
      type: DataTypes.ENUM('draft', 'active', 'paused', 'expired', 'cancelled'),
      defaultValue: 'draft'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    applicableProducts: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: []
    },
    excludedProducts: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: []
    },
    customerGroups: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Promotion',
    tableName: 'Promotions',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['status'] },
      { fields: ['startDate'] },
      { fields: ['endDate'] },
      { fields: ['type'] },
      { fields: ['priority'] },
      { fields: ['createdBy'] }
    ]
  });

  return Promotion;
}; 