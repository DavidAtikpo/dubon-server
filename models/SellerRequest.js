import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const SellerRequest = sequelize.define('SellerRequest', {
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
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    businessType: {
      type: DataTypes.ENUM('products', 'restaurant', 'training', 'events', 'services'),
      allowNull: false
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    businessAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    idCardUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    addressProofUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    businessDocumentUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subscriptionPlan: {
      type: DataTypes.ENUM('commission', 'monthly', 'biannual', 'annual'),
      allowNull: true
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('trial', 'active', 'expired'),
      defaultValue: 'trial'
    },
    trialEndsAt: {
      type: DataTypes.DATE
    },
    subscriptionEndsAt: {
      type: DataTypes.DATE
    },
    rejectionReason: {
      type: DataTypes.TEXT
    },
    adminNotes: {
      type: DataTypes.TEXT
    }
  });

  return SellerRequest;
}; 