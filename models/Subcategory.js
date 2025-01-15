import { DataTypes } from 'sequelize';

const SubcategoryModel = (sequelize) => {
  const Subcategory = sequelize.define('Subcategory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id'
      }
    }
  }, {
    tableName: 'Subcategories',
    timestamps: true,
    underscored: false
  });

  Subcategory.associate = (models) => {
    Subcategory.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });
    
    Subcategory.hasMany(models.Product, {
      foreignKey: 'subcategoryId',
      as: 'products'
    });
  };

  return Subcategory;
};

export default SubcategoryModel; 