import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Training extends Model {
    static associate(models) {
      Training.hasMany(models.Participant, {
        foreignKey: 'trainingId',
        as: 'participants'
      });
      Training.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  Training.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    syllabus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    instructor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    participantsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    level: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'debutant',
      validate: {
        isIn: [['debutant', 'intermediaire', 'avance']]
      }
    },
    prerequisites: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    objectives: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'cancelled'),
      defaultValue: 'draft',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Training',
    tableName: 'Trainings',
    timestamps: true
  });

  return Training;
};
