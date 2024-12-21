import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class SystemSetting extends Model {
    static associate(models) {
      SystemSetting.belongsTo(models.User, {
        foreignKey: 'lastModifiedBy',
        as: 'modifier'
      });
    }
  }

  SystemSetting.init({
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
    category: {
      type: DataTypes.ENUM(
        'general',
        'payment',
        'email',
        'notification',
        'security',
        'integration',
        'appearance',
        'seller',
        'order'
      ),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    dataType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    validationRules: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    defaultValue: {
      type: DataTypes.JSONB,
      defaultValue: null
    },
    options: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    group: {
      type: DataTypes.STRING
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastModifiedBy: {
      type: DataTypes.UUID,
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
    modelName: 'SystemSetting',
    timestamps: true,
    indexes: [
      { fields: ['key'], unique: true },
      { fields: ['category'] },
      { fields: ['isPublic'] },
      { fields: ['group'] },
      { fields: ['order'] }
    ]
  });

  return SystemSetting;
}; 