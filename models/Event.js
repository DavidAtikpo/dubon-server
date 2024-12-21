import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Event extends Model {
    static associate(models) {
      Event.belongsTo(models.SellerProfile, {
        foreignKey: {
          name: 'sellerId',
          allowNull: false,
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        as: 'seller'
      });

      Event.hasMany(models.Review, {
        foreignKey: 'eventId',
        as: 'reviews'
      });

      Event.hasMany(models.Rating, {
        foreignKey: 'eventId',
        as: 'ratings'
      });

      Event.hasMany(models.Favorite, {
        foreignKey: 'eventId',
        as: 'favorites'
      });
    }
  }

  Event.init({
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
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
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
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    schedule: {
      type: DataTypes.JSONB,
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
    status: {
      type: DataTypes.ENUM('draft', 'active', 'cancelled', 'completed'),
      defaultValue: 'draft'
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    registrations: {
      type: DataTypes.JSONB,
      defaultValue: {
        total: 0,
        available: 0
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Event',
    tableName: 'Events',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['slug'], unique: true },
      { fields: ['status'] },
      { fields: ['startDate'] },
      { fields: ['endDate'] }
    ]
  });

  return Event;
};

