import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Service = sequelize.define('Service', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    price: DataTypes.DECIMAL(10, 2),
    image: DataTypes.STRING,
    provider: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    duration: DataTypes.STRING,
    category: DataTypes.STRING
  });

  return Service;
};
