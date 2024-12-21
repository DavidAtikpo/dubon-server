import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, {
        foreignKey: {
          name: 'categoryId',
          allowNull: true,
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        as: 'category'
      });

      Product.belongsTo(models.SellerProfile, {
        foreignKey: {
          name: 'sellerId',
          allowNull: false,
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        as: 'seller'
      });

      Product.belongsToMany(models.Cart, {
        through: 'CartItems',
        foreignKey: 'productId',
        as: 'carts'
      });

      Product.belongsToMany(models.Order, {
        through: 'OrderItems',
        foreignKey: 'productId',
        as: 'orders'
      });

      Product.hasMany(models.Review, {
        foreignKey: 'productId',
        as: 'reviews'
      });

      Product.hasMany(models.Rating, {
        foreignKey: 'productId',
        as: 'productRatings'
      });

      Product.hasMany(models.Favorite, {
        foreignKey: 'productId',
        as: 'favorites'
      });

      Product.belongsToMany(models.Promotion, {
        through: 'PromotionProducts',
        foreignKey: 'productId',
        as: 'promotions'
      });
    }
  }

  Product.init({
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
    slug: {
      type: DataTypes.STRING,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    shortDescription: {
      type: DataTypes.TEXT
    },
    sku: {
      type: DataTypes.STRING,
      unique: true
    },
    barcode: {
      type: DataTypes.STRING
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(10, 2)
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 2)
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lowStockThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    weight: {
      type: DataTypes.FLOAT
    },
    dimensions: {
      type: DataTypes.JSONB,
      defaultValue: {
        length: null,
        width: null,
        height: null,
        unit: 'cm'
      }
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    mainImage: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'inactive', 'archived'),
      defaultValue: 'draft'
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isDigital: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    digitalFiles: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    attributes: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    variants: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    ratings: {
      type: DataTypes.JSONB,
      defaultValue: {
        average: 0,
        count: 0
      }
    },
    seoTitle: {
      type: DataTypes.STRING
    },
    seoDescription: {
      type: DataTypes.TEXT
    },
    seoKeywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'Products',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['categoryId'] },
      { fields: ['slug'], unique: true },
      { fields: ['sku'], unique: true },
      { fields: ['status'] },
      { fields: ['featured'] }
    ]
  });

  return Product;
};