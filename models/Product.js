import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    category: {
      type: DataTypes.ENUM('Alimentaire', 'Électronique', 'Mode', 'Maison', 'Beauté', 'Sport', 'Autre'),
      allowNull: false
    },
    subCategory: DataTypes.STRING,
    discountPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    discountStartDate: DataTypes.DATE,
    discountEndDate: DataTypes.DATE,
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'draft'),
      defaultValue: 'active'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    video: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'products'
  });

  // Méthodes virtuelles
  Product.prototype.getDiscountedPrice = function() {
    if (!this.isDiscountActive()) {
      return this.price;
    }
    return this.price * (1 - this.discountPercentage / 100);
  };

  Product.prototype.isDiscountActive = function() {
    if (!this.discountPercentage || !this.discountStartDate || !this.discountEndDate) {
      return false;
    }
    const now = new Date();
    return (
      now >= this.discountStartDate &&
      now <= this.discountEndDate &&
      this.discountPercentage > 0
    );
  };

  return Product;
};