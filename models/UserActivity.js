import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const UserActivity = sequelize.define('UserActivity', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    details: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    ipAddress: {
      type: DataTypes.STRING(45)
    },
    userAgent: {
      type: DataTypes.TEXT
    },
    deviceInfo: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    location: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  });

  return UserActivity;
}; 