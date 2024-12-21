import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class SystemLog extends Model {
    static associate(models) {
      SystemLog.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  SystemLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    level: {
      type: DataTypes.ENUM('info', 'warning', 'error', 'debug', 'critical'),
      allowNull: false,
      defaultValue: 'info'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    details: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    source: {
      type: DataTypes.STRING
    },
    ipAddress: {
      type: DataTypes.STRING
    },
    userAgent: {
      type: DataTypes.STRING
    },
    requestMethod: {
      type: DataTypes.STRING
    },
    requestUrl: {
      type: DataTypes.STRING
    },
    requestParams: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    responseStatus: {
      type: DataTypes.INTEGER
    },
    duration: {
      type: DataTypes.INTEGER // en millisecondes
    },
    stackTrace: {
      type: DataTypes.TEXT
    },
    environment: {
      type: DataTypes.STRING,
      defaultValue: process.env.NODE_ENV || 'production'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'SystemLog',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['level'] },
      { fields: ['category'] },
      { fields: ['action'] },
      { fields: ['createdAt'] },
      { fields: ['environment'] }
    ]
  });

  return SystemLog;
}; 