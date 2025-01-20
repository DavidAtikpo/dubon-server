import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Participant extends Model {
    static associate(models) {
      Participant.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      Participant.belongsTo(models.Training, {
        foreignKey: 'trainingId',
        as: 'training'
      });
    }
  }

  Participant.init({
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
    trainingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Trainings',
        key: 'id'
      }
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
      defaultValue: 'pending'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      defaultValue: 'pending'
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Participant',
    tableName: 'Participants',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['trainingId'] },
      { fields: ['status'] },
      { fields: ['paymentStatus'] }
    ]
  });

  return Participant;
}; 