import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Dish = sequelize.define('Dish', {
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
      allowNull: false
    },
    image: DataTypes.STRING,
    category: DataTypes.STRING,
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    preparationTime: DataTypes.STRING,
    ingredients: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    allergens: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    nutritionalInfo: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    spicyLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isVegetarian: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVegan: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  Dish.associate = (models) => {
    Dish.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      as: 'restaurant'
    });
  };

  return Dish;
}; 