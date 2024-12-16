import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // 1. Créer une nouvelle table avec la nouvelle structure
    await queryInterface.createTable('users_new', {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
      },
      profile_photo_url: {
        type: DataTypes.STRING,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      email_verification_token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      email_verification_expires: {
        type: DataTypes.DATE,
        allowNull: true
      },
      refresh_token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, { transaction });

    // 2. Copier les données de l'ancienne table vers la nouvelle
    await queryInterface.sequelize.query(`
      INSERT INTO users_new (
        id, name, email, password, role, 
        profile_photo_url, email_verified, 
        email_verification_token, email_verification_expires, 
        refresh_token, created_at, updated_at
      )
      SELECT 
        id, name, email, password, role, 
        "profilePhotoUrl", "emailVerified", 
        "emailVerificationToken", "emailVerificationExpires", 
        "refreshToken", created_at, updated_at
      FROM users;
    `, { transaction });

    // 3. Supprimer l'ancienne table
    await queryInterface.dropTable('users', { transaction });

    // 4. Renommer la nouvelle table
    await queryInterface.renameTable('users_new', 'users', { transaction });

    // 5. Recréer les index nécessaires
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      transaction
    });

    await transaction.commit();
  } catch (error) {
    console.error('Migration error:', error);
    await transaction.rollback();
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // 1. Créer une table temporaire avec l'ancienne structure
    await queryInterface.createTable('users_old', {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
      },
      profilePhotoUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      emailVerificationExpires: {
        type: DataTypes.DATE,
        allowNull: true
      },
      refreshToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }, { transaction });

    // 2. Copier les données
    await queryInterface.sequelize.query(`
      INSERT INTO users_old (
        id, name, email, password, role, 
        "profilePhotoUrl", "emailVerified", 
        "emailVerificationToken", "emailVerificationExpires", 
        "refreshToken", created_at, updated_at
      )
      SELECT 
        id, name, email, password, role, 
        profile_photo_url, email_verified, 
        email_verification_token, email_verification_expires, 
        refresh_token, created_at, updated_at
      FROM users;
    `, { transaction });

    // 3. Supprimer la nouvelle table
    await queryInterface.dropTable('users', { transaction });

    // 4. Renommer l'ancienne table
    await queryInterface.renameTable('users_old', 'users', { transaction });

    await transaction.commit();
  } catch (error) {
    console.error('Rollback error:', error);
    await transaction.rollback();
    throw error;
  }
} 