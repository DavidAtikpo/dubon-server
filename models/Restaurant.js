import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const RestaurantItem = sequelize.define('RestaurantItem', {
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
    category: {
      type: DataTypes.ENUM('entrée', 'plat principal', 'dessert', 'boisson'),
      allowNull: false
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    ingredients: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    image: DataTypes.STRING
  }, {
    timestamps: true
  });

  return RestaurantItem;
};
