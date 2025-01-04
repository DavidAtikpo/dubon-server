import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Shop = sequelize.define('Shop', {
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
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    location: DataTypes.STRING,
    category: DataTypes.STRING,
    productsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  return Shop;
}; 