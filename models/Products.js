import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: { 
      type: DataTypes.STRING,
      allowNull: false 
    },
    sku: { 
      type: DataTypes.STRING,
      allowNull: true 
    },
    vendor: { 
      type: DataTypes.STRING,
      allowNull: true 
    },
    price: { 
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    oldPrice: { 
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0 
    },
    discount: { 
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    category: { 
      type: DataTypes.STRING,
      allowNull: false 
    },
    availability: { 
      type: DataTypes.STRING,
      defaultValue: 'Disponible' 
    },
    description: { 
      type: DataTypes.TEXT 
    },
    features: { 
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [] 
    },
    shippingInfo: { 
      type: DataTypes.JSONB,
      defaultValue: [] 
    },
    images: { 
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [] 
    },
    rating: { 
      type: DataTypes.FLOAT,
      defaultValue: 0 
    },
    reviews: { 
      type: DataTypes.JSONB,
      defaultValue: [] 
    },
    relatedProducts: { 
      type: DataTypes.JSONB,
      defaultValue: [] 
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['vendor']
      },
      {
        fields: ['title']
      },
      {
        fields: ['price']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Associations
  Product.associate = (models) => {
    Product.belongsTo(models.User, {
      foreignKey: 'sellerId',
      as: 'seller'
    });
  };

  return Product;
};
