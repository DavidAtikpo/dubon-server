const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Ajouter les nouvelles colonnes
      await queryInterface.addColumn('sellers', 'type', {
        type: DataTypes.ENUM('individual', 'company'),
        allowNull: false,
        defaultValue: 'individual'
      }, { transaction });

      await queryInterface.addColumn('sellers', 'personal_info', {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
      }, { transaction });

      await queryInterface.addColumn('sellers', 'documents', {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          idCard: null,
          proofOfAddress: null,
          taxCertificate: null,
          photos: [],
          rccm: null,
          companyStatutes: null
        }
      }, { transaction });

      await queryInterface.addColumn('sellers', 'contract', {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          signed: false,
          signedDocument: null
        }
      }, { transaction });

      await queryInterface.addColumn('sellers', 'video_verification', {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          completed: false,
          recordingUrl: null
        }
      }, { transaction });

      await queryInterface.addColumn('sellers', 'business_info', {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          category: '',
          description: '',
          products: [],
          bankDetails: {},
          returnPolicy: ''
        }
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('sellers', 'type', { transaction });
      await queryInterface.removeColumn('sellers', 'personal_info', { transaction });
      await queryInterface.removeColumn('sellers', 'documents', { transaction });
      await queryInterface.removeColumn('sellers', 'contract', { transaction });
      await queryInterface.removeColumn('sellers', 'video_verification', { transaction });
      await queryInterface.removeColumn('sellers', 'business_info', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 