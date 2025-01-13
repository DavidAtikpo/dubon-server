import { DataTypes } from 'sequelize';

const Shop = (sequelize) => {
  const Shop = sequelize.define('Shop', {
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
      type: DataTypes.TEXT,
      allowNull: true
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    coverImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    totalSales: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contactInfo: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    openingHours: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    categories: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  }, {
    timestamps: true,
    tableName: 'Shops'
  });

  Shop.associate = (models) => {
    Shop.belongsTo(models.SellerProfile, {
      foreignKey: 'sellerId',
      as: 'seller'
    });
    
    Shop.hasMany(models.Product, {
      foreignKey: 'shopId',
      as: 'products'
    });
  };

  return Shop;
};

export default Shop; 