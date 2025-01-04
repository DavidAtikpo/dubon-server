import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Event = sequelize.define('Event', {
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
    image: DataTypes.STRING,
    date: DataTypes.DATE,
    location: DataTypes.STRING,
    price: DataTypes.DECIMAL(10, 2),
    availableTickets: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    category: DataTypes.STRING
  });

  return Event;
};

