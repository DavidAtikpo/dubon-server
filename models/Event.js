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
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false
    },
    continent: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    media: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    isLive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    liveStreamLink: DataTypes.STRING,
    organizer: {
      type: DataTypes.STRING,
      allowNull: false
    },
    maxAttendees: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    attendees: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'ongoing', 'completed'),
      defaultValue: 'upcoming'
    }
  }, {
    timestamps: true
  });

  return Event;
};

