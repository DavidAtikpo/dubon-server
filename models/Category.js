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
          name: 'parentId',
          allowNull: true,
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        as: 'parent'
      });

      Category.hasMany(models.Category, {
        foreignKey: 'parentId',
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
    parentId: {
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
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Category',
    timestamps: true,
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['parentId'] },
      { fields: ['status'] },
      { fields: ['displayOrder'] },
      { fields: ['level'] },
      { fields: ['path'] }
    ]
  });

  return Category;
}; 