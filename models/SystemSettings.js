import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const SystemSettings = sequelize.define('SystemSettings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    category: {
      type: DataTypes.STRING
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    updatedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'system_settings',
    indexes: [
      { fields: ['key'] },
      { fields: ['category'] }
    ]
  });

  SystemSettings.associate = (models) => {
    SystemSettings.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'lastUpdatedBy'
    });
  };

  return SystemSettings;
}; 