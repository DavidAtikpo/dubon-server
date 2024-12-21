import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL n\'est pas définie');
  process.exit(1);
}

// Configuration SSL pour pg
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
pg.defaults.ssl = true;

// Configuration de base pour Sequelize
const sequelizeConfig = {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Création de l'instance Sequelize
export const sequelize = new Sequelize(dbUrl, sequelizeConfig);

// Fonction d'initialisation de la base de données
export const initializeDatabase = async () => {
  try {
    // Test de la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie avec succès');

    // Synchronisation des modèles avec la base de données
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Base de données synchronisée en mode development');
    } else {
      await sequelize.sync();
      console.log('✅ Base de données synchronisée en mode production');
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    throw error;
  }
};

// Fonction de fermeture de la connexion
export const closeDatabase = async () => {
  try {
    await sequelize.close();
    console.log('✅ Connexion à la base de données fermée');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture de la connexion:', error);
    throw error;
  }
};

export default {
  sequelize,
  initializeDatabase,
  closeDatabase
};


