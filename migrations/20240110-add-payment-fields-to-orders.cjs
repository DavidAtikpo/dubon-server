module.exports = {
  async up(queryInterface, Sequelize) {
    // Créer d'abord l'enum pour paymentStatus
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_Orders_paymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.addColumn('Orders', 'paymentStatus', {
      type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
      allowNull: false
    });

    await queryInterface.addColumn('Orders', 'paymentMethod', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'transactionId', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'shippingAddress', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Orders', 'paymentStatus');
    await queryInterface.removeColumn('Orders', 'paymentMethod');
    await queryInterface.removeColumn('Orders', 'transactionId');
    await queryInterface.removeColumn('Orders', 'shippingAddress');
    
    // Supprimer l'enum paymentStatus
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Orders_paymentStatus";');
  }
}; 