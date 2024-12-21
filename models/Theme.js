import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Theme extends Model {
    static associate(models) {
      Theme.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
    }
  }

  Theme.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    colors: {
      type: DataTypes.JSONB,
      defaultValue: {
        primary: '#1D4ED8',
        secondary: '#1e40af',
        accent: '#3b82f6',
        background: '#ffffff',
        text: '#000000'
      }
    },
    fonts: {
      type: DataTypes.JSONB,
      defaultValue: {
        primary: 'Inter',
        secondary: 'sans-serif',
        sizes: {
          base: '16px',
          heading: '24px'
        }
      }
    },
    spacing: {
      type: DataTypes.JSONB,
      defaultValue: {
        base: '4px',
        small: '8px',
        medium: '16px',
        large: '24px'
      }
    },
    borderRadius: {
      type: DataTypes.JSONB,
      defaultValue: {
        small: '4px',
        medium: '8px',
        large: '16px'
      }
    },
    shadows: {
      type: DataTypes.JSONB,
      defaultValue: {
        small: '0 1px 3px rgba(0,0,0,0.12)',
        medium: '0 4px 6px rgba(0,0,0,0.1)',
        large: '0 10px 15px rgba(0,0,0,0.1)'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    customCss: {
      type: DataTypes.TEXT
    },
    variables: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    createdBy: {
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
    modelName: 'Theme',
    timestamps: true,
    indexes: [
      { fields: ['name'], unique: true },
      { fields: ['isActive'] },
      { fields: ['isSystem'] },
      { fields: ['createdBy'] }
    ]
  });

  return Theme;
}; 