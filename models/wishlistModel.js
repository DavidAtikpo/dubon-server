import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Wishlist = sequelize.define('Wishlist', {
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
    }
  }, {
    timestamps: true
  });

  const WishlistItem = sequelize.define('WishlistItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    wishlistId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Wishlists',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    addedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true
  });

  // Associations
  Wishlist.associate = (models) => {
    Wishlist.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'wishlistOwner'
    });
    Wishlist.belongsToMany(models.Product, {
      through: WishlistItem,
      foreignKey: 'wishlistId',
      otherKey: 'productId',
      as: 'wishlistProducts'
    });
  };

  WishlistItem.associate = (models) => {
    WishlistItem.belongsTo(Wishlist, {
      foreignKey: 'wishlistId'
    });
    WishlistItem.belongsTo(models.Product, {
      foreignKey: 'productId'
    });
  };

  return { Wishlist, WishlistItem };
};
