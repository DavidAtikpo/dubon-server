import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'phone', {
    type: DataTypes.STRING,
    allowNull: true
  });

  await queryInterface.addColumn('users', 'address', {
    type: DataTypes.STRING,
    allowNull: true
  });

  // Renommer les colonnes existantes pour correspondre au nouveau format
  await queryInterface.renameColumn('users', 'profilePhotoUrl', 'profile_photo_url');
  await queryInterface.renameColumn('users', 'emailVerified', 'email_verified');
  await queryInterface.renameColumn('users', 'emailVerificationToken', 'email_verification_token');
  await queryInterface.renameColumn('users', 'emailVerificationExpires', 'email_verification_expires');
  await queryInterface.renameColumn('users', 'refreshToken', 'refresh_token');
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('users', 'phone');
  await queryInterface.removeColumn('users', 'address');
  
  // Restaurer les anciens noms de colonnes
  await queryInterface.renameColumn('users', 'profile_photo_url', 'profilePhotoUrl');
  await queryInterface.renameColumn('users', 'email_verified', 'emailVerified');
  await queryInterface.renameColumn('users', 'email_verification_token', 'emailVerificationToken');
  await queryInterface.renameColumn('users', 'email_verification_expires', 'emailVerificationExpires');
  await queryInterface.renameColumn('users', 'refresh_token', 'refreshToken');
} 