import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Product, {
        foreignKey: 'categoryId',
        as: 'products'
      });

      Category.hasMany(models.RestaurantItem, {
        foreignKey: 'categoryId',
        as: 'menuItems'
      });

      Category.belongsTo(models.Category, {
        foreignKey: {
          name: 'parent_id',
          allowNull: true,
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        as: 'parent'
      });

      Category.hasMany(models.Category, {
        foreignKey: 'parent_id',
        as: 'subcategories'
      });
    }
  }

  Category.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    path: {
      type: DataTypes.STRING
    },
    icon: {
      type: DataTypes.STRING
    },
    image: {
      type: DataTypes.STRING
    },
    banner: {
      type: DataTypes.STRING
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    showInMenu: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    showInHome: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    attributes: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    seoTitle: {
      type: DataTypes.STRING
    },
    seoDescription: {
      type: DataTypes.TEXT
    },
    seoKeywords: {
      type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'Category',
    tableName: 'Categories',
    paranoid: true,
    indexes: [
      {
        name: 'categories_parent_id',
        fields: ['parent_id']
      },
      {
        name: 'categories_slug',
        unique: true,
        fields: ['slug']
      }
    ]
  });

  return Category;
}; 