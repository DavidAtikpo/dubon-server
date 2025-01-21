import { DataTypes } from 'sequelize';

const ServiceRequestModel = (sequelize) => {
  const ServiceRequest = sequelize.define('ServiceRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serviceType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    preferredDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    preferredTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    urgency: {
      type: DataTypes.ENUM('normal', 'urgent', 'très urgent'),
      defaultValue: 'normal'
    },
    contactName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed'),
      defaultValue: 'pending'
    }
  }, {
    timestamps: true
  });

  return ServiceRequest;
};

export default ServiceRequestModel; 