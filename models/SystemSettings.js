import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class SystemSettings extends Model {
    static associate(models) {
      SystemSettings.belongsTo(models.User, {
        foreignKey: {
          name: 'updated_by',
          allowNull: true
        },
        as: 'lastUpdatedBy'
      });
    }
  }

  SystemSettings.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    description: {
      type: DataTypes.TEXT
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'general'
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by',
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'SystemSettings',
    tableName: 'SystemSettings',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['key'], unique: true },
      { fields: ['category'] },
      { fields: ['updated_by'] }
    ]
  });

  return SystemSettings;
}; 