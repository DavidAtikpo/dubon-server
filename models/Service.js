import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Service extends Model {
    static associate(models) {
      Service.belongsTo(models.SellerProfile, {
        foreignKey: {
          name: 'sellerId',
          allowNull: false,
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        as: 'seller'
      });

      Service.hasMany(models.Review, {
        foreignKey: 'serviceId',
        as: 'reviews'
      });

      Service.hasMany(models.Rating, {
        foreignKey: 'serviceId',
        as: 'serviceRatings'
      });

      Service.hasMany(models.Favorite, {
        foreignKey: 'serviceId',
        as: 'favorites'
      });
    }
  }

  Service.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
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
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    availability: {
      type: DataTypes.JSONB,
      defaultValue: {
        schedule: {},
        exceptions: []
      }
    },
    location: {
      type: DataTypes.JSONB,
      defaultValue: {
        type: 'onsite',
        address: null,
        coordinates: {
          latitude: null,
          longitude: null
        },
        serviceArea: []
      }
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    requirements: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    included: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    excluded: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    cancellationPolicy: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'inactive', 'archived'),
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
    modelName: 'Service',
    tableName: 'Services',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['slug'], unique: true },
      { fields: ['status'] },
      { fields: ['category'] }
    ]
  });

  return Service;
};
