import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Review = sequelize.define('Review', {
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Champ polymorphique pour permettre les reviews sur différents types d'items
    reviewableId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    reviewableType: {
      type: DataTypes.ENUM('Product', 'Service', 'Event', 'Seller'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    helpfulCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    reportCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });

  Review.associate = (models) => {
    Review.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Associations polymorphiques
    Review.belongsTo(models.Product, {
      foreignKey: 'reviewableId',
      constraints: false,
      as: 'product',
      scope: {
        reviewableType: 'Product'
      }
    });

    Review.belongsTo(models.Service, {
      foreignKey: 'reviewableId',
      constraints: false,
      as: 'service',
      scope: {
        reviewableType: 'Service'
      }
    });

    Review.belongsTo(models.Event, {
      foreignKey: 'reviewableId',
      constraints: false,
      as: 'event',
      scope: {
        reviewableType: 'Event'
      }
    });

    Review.belongsTo(models.SellerProfile, {
      foreignKey: 'reviewableId',
      constraints: false,
      as: 'seller',
      scope: {
        reviewableType: 'Seller'
      }
    });
  };

  return Review;
}; 