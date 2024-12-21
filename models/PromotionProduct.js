import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class PromotionProduct extends Model {
    static associate(models) {
      PromotionProduct.belongsTo(models.Promotion, {
        foreignKey: {
          name: 'promotionId',
          allowNull: false,
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        as: 'promotion'
      });

      PromotionProduct.belongsTo(models.Product, {
        foreignKey: {
          name: 'productId',
          allowNull: false,
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        as: 'product'
      });
    }
  }

  PromotionProduct.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    promotionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Promotions',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    maxUsage: {
      type: DataTypes.INTEGER
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    startDate: {
      type: DataTypes.DATE
    },
    endDate: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'expired'),
      defaultValue: 'active'
    },
    conditions: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'PromotionProduct',
    tableName: 'PromotionProducts',
    timestamps: true,
    indexes: [
      { fields: ['promotionId'] },
      { fields: ['productId'] },
      { fields: ['status'] },
      { fields: ['startDate'] },
      { fields: ['endDate'] },
      // Contrainte unique pour éviter les doublons
      { fields: ['promotionId', 'productId'], unique: true }
    ]
  });

  return PromotionProduct;
}; 