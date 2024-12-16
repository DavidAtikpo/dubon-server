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
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    category: {
      type: DataTypes.ENUM('assistance', 'installation', 'nettoyage', 'formation', 'autre'),
      allowNull: false
    },
    availability: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    durationInHours: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        hasRequiredFields(value) {
          const required = ['street', 'city', 'postal_code', 'country'];
          for (const field of required) {
            if (!value[field]) {
              throw new Error(`${field} est requis dans location`);
            }
          }
        }
      }
    }
  }, {
    timestamps: true
  });

  return Service;
};
