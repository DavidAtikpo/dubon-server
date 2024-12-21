import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Training extends Model {
    static associate(models) {
      Training.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });

      Training.hasMany(models.Review, {
        foreignKey: 'trainingId',
        as: 'reviews'
      });

      Training.belongsToMany(models.Order, {
        through: 'OrderTrainings',
        foreignKey: 'trainingId',
        as: 'orders'
      });
    }
  }

  Training.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'SellerProfiles',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER, // en minutes
      allowNull: false
    },
    level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      defaultValue: 'beginner'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    registeredCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    schedule: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    location: {
      type: DataTypes.JSONB,
      defaultValue: {
        type: 'physical', // physical, online, hybrid
        venue: null,
        address: null,
        coordinates: {
          latitude: null,
          longitude: null
        },
        onlineLink: null
      }
    },
    instructor: {
      type: DataTypes.JSONB,
      defaultValue: {
        name: null,
        bio: null,
        photo: null,
        qualifications: []
      }
    },
    materials: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    prerequisites: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    objectives: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'),
      defaultValue: 'draft'
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    ratings: {
      type: DataTypes.JSONB,
      defaultValue: {
        average: 0,
        count: 0
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    tableName: 'Trainings',
    modelName: 'Training',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['slug'] },
      { fields: ['status'] },
      { fields: ['category'] },
      { fields: ['level'] }
    ]
  });

  return Training;
};
