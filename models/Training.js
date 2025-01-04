import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Training = sequelize.define('Training', {
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
    instructor: DataTypes.STRING,
    startDate: DataTypes.DATE,
    duration: DataTypes.STRING,
    price: DataTypes.DECIMAL(10, 2),
    participantsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxParticipants: DataTypes.INTEGER
  });

  return Training;
};
