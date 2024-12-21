import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class RestaurantItem extends Model {
    static associate(models) {
      RestaurantItem.belongsTo(models.SellerProfile, {
        foreignKey: {
          name: 'sellerId',
          allowNull: false,
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        as: 'seller'
      });

      RestaurantItem.belongsTo(models.Category, {
        foreignKey: {
          name: 'categoryId',
          allowNull: true,
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        as: 'category'
      });

      RestaurantItem.hasMany(models.Rating, {
        foreignKey: 'itemId',
        as: 'itemRatings'
      });

      RestaurantItem.hasMany(models.Favorite, {
        foreignKey: 'itemId',
        as: 'favorites'
      });
    }
  }

  RestaurantItem.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    image: {
      type: DataTypes.STRING
    },
    ingredients: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    allergens: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    nutritionalInfo: {
      type: DataTypes.JSONB,
      defaultValue: {
        calories: null,
        protein: null,
        carbs: null,
        fat: null
      }
    },
    preparationTime: {
      type: DataTypes.INTEGER,
      defaultValue: 15
    },
    spicyLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    customizations: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'soldout'),
      defaultValue: 'active'
    },
    ratingStats: {
      type: DataTypes.JSONB,
      defaultValue: {
        average: 0,
        count: 0
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'RestaurantItem',
    tableName: 'RestaurantItems',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['categoryId'] },
      { fields: ['status'] },
      { fields: ['available'] }
    ]
  });

  return RestaurantItem;
}; 