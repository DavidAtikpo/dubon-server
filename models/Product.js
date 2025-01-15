import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, {
        foreignKey: {
          name: 'categoryId',
          allowNull: true,
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        as: 'category'
      });

      Product.belongsTo(models.Subcategory, {
        foreignKey: {
          name: 'subcategoryId',
          allowNull: true,
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        as: 'subcategory'
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

      Product.belongsTo(models.Shop, {
        foreignKey: 'shopId',
        as: 'shop'
      });
    }
  }

  Product.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Shops',
        key: 'id'
      }
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'SellerProfiles',
        key: 'id'
      }
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    subcategoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Subcategories',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    shortDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sku: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    barcode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    lowStockThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: {
        min: 0
      }
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    dimensions: {
      type: DataTypes.JSONB,
      defaultValue: {
        length: null,
        width: null,
        height: null,
        unit: 'cm'
      },
      validate: {
        isValidDimensions(value) {
          if (value.length && typeof value.length !== 'number') {
            throw new Error('La longueur doit être un nombre');
          }
          if (value.width && typeof value.width !== 'number') {
            throw new Error('La largeur doit être un nombre');
          }
          if (value.height && typeof value.height !== 'number') {
            throw new Error('La hauteur doit être un nombre');
          }
          if (!['cm', 'm', 'in'].includes(value.unit)) {
            throw new Error('Unité de mesure invalide');
          }
        }
      }
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Au moins une image est requise"
        }
      }
    },
    mainImage: {
      type: DataTypes.STRING,
      allowNull: false
    },
    video: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'inactive', 'archived'),
      defaultValue: 'draft',
      allowNull: false
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    salesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    seoTitle: {
      type: DataTypes.STRING(70),
      allowNull: true
    },
    seoDescription: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    seoKeywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },

    // Champs spécifiques aux produits alimentaires
    productType: {
      type: DataTypes.ENUM('frais', 'surgelé', 'sec', 'conserve'),
      allowNull: false,
      defaultValue: 'frais'
    },
    storageConditions: {
      type: DataTypes.ENUM('ambiant', 'réfrigéré', 'congelé'),
      allowNull: false,
      defaultValue: 'ambiant'
    },
    temperature: {
      type: DataTypes.JSONB,
      defaultValue: {
        min: null,
        max: null,
        unit: '°C'
      },
      validate: {
        isValidTemperature(value) {
          if (value.min && typeof value.min !== 'number') {
            throw new Error('La température minimale doit être un nombre');
          }
          if (value.max && typeof value.max !== 'number') {
            throw new Error('La température maximale doit être un nombre');
          }
          if (value.min && value.max && value.min > value.max) {
            throw new Error('La température minimale ne peut pas être supérieure à la température maximale');
          }
          if (!['°C', '°F'].includes(value.unit)) {
            throw new Error('Unité de température invalide');
          }
        }
      }
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shelfLife: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      },
      comment: 'Durée de conservation en jours'
    },
    nutritionalInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        calories: null,
        proteins: null,
        carbohydrates: null,
        fats: null,
        fiber: null,
        sodium: null,
        servingSize: null,
        allergens: []
      },
      validate: {
        isValidNutritionalInfo(value) {
          if (value === null) return;
          
          // S'assurer que allergens est un tableau
          if (value && !Array.isArray(value.allergens)) {
            value.allergens = [];
          }

          const requiredFields = ['calories', 'proteins', 'carbohydrates', 'fats', 'fiber', 'sodium', 'servingSize', 'allergens'];
          for (const field of requiredFields) {
            if (!Object.prototype.hasOwnProperty.call(value, field)) {
              value[field] = field === 'allergens' ? [] : null;
            }
          }
        }
      }
    },
    origin: {
      type: DataTypes.STRING,
      allowNull: true
    },
    packaging: {
      type: DataTypes.JSONB,
      defaultValue: {
        type: null,
        material: null,
        weight: null,
        units: null
      }
    },
    certifications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    preparationTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      },
      comment: 'Temps de préparation en minutes'
    },
    cookingInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ingredients: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'Products',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        unique: true,
        fields: ['sku']
      },
      {
        fields: ['status']
      },
      {
        fields: ['categoryId']
      },
      {
        fields: ['sellerId']
      }
    ]
  });

  return Product;
};