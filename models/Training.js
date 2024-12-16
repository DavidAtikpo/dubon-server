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
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    category: {
      type: DataTypes.ENUM('cuisine', 'management', 'informatique', 'développement personnel'),
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    durationInDays: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    timestamps: true
  });

  Training.associate = (models) => {
    Training.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };

  return Training;
};
