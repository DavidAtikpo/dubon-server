import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class SellerHistory extends Model {
    static associate(models) {
      SellerHistory.belongsTo(models.SellerProfile, {
        foreignKey: 'sellerId',
        as: 'seller'
      });
    }
  }

  SellerHistory.init({
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
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type d\'action (profile, product, order, withdrawal, promotion, etc.)'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Action spécifique (create, update, delete, etc.)'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Description détaillée de l\'action'
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Détails supplémentaires de l\'action'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'success',
      comment: 'Statut de l\'action (success, failed)'
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Adresse IP de l\'utilisateur'
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User agent du navigateur'
    }
  }, {
    sequelize,
    modelName: 'SellerHistory',
    tableName: 'SellerHistories',
    timestamps: true,
    indexes: [
      {
        fields: ['sellerId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  return SellerHistory;
}; 