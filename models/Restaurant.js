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
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
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
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    image: DataTypes.STRING,
    cuisine: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
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
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
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