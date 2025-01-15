import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false // Désactiver les logs en production
};

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  ...dbConfig
});

export const initializeDatabase = async () => {
  try {
    // Activer l'extension UUID
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('✅ Extension UUID activée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'activation de l\'extension UUID:', error);
    throw error;
  }
};

export const checkDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à PostgreSQL établie avec succès');
    // Initialiser la base de données après la connexion
    await initializeDatabase();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    return false;
  }
};