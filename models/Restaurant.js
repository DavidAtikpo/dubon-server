import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Restaurant = sequelize.define('Restaurant', {
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
    image: DataTypes.STRING,
    cuisine: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    address: DataTypes.STRING,
    openingHours: DataTypes.STRING,
    priceRange: DataTypes.STRING,
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending'),
      defaultValue: 'pending'
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    features: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    contactPhone: DataTypes.STRING,
    contactEmail: DataTypes.STRING,
    socialMedia: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    deliveryOptions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    paymentMethods: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  });

  Restaurant.associate = (models) => {
    if (!models.User || !models.Dish || !models.Review) {
      console.error('Missing required models for Restaurant associations');
      return;
    }

    Restaurant.belongsTo(models.User, {
      foreignKey: 'sellerId',
      as: 'seller'
    });

    Restaurant.hasMany(models.Dish, {
      foreignKey: 'restaurantId',
      as: 'dishes'
    });

    Restaurant.hasMany(models.Review, {
      foreignKey: 'restaurantId',
      as: 'reviews'
    });
  };

  return Restaurant;
}; 