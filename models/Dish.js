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
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    preparationTime: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ingredients: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    specialDiet: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    isSpicy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVegetarian: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPromoted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    promotionalPrice: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Restaurants',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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