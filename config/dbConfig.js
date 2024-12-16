import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg';

// Configuration SSL pour pg
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
pg.defaults.ssl = true;

dotenv.config();

// Vérification de DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas définie');
  process.exit(1);
}

// Configuration de base pour Sequelize
const sequelizeConfig = {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    keepAlive: true,
    statement_timeout: 60000
  },
  ssl: true,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Création de l'instance avec une URL modifiée
const dbUrl = `${process.env.DATABASE_URL}?sslmode=require`;
export const sequelize = new Sequelize(dbUrl, sequelizeConfig);

// Fonction de connexion
const dbConnect = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Connexion DB OK');
    
    // Import et sync des modèles
    const models = await Promise.all([
      import('../models/User.js'),
      import('../models/Product.js'),
      import('../models/Seller.js'),
      import('../models/Order.js'),
    ]);
    
    models.forEach(model => model.default(sequelize));
    
    await sequelize.sync();
    console.log('✓ Sync modèles OK');
    
  } catch (error) {
    console.error('Erreur connexion DB:', error.message);
    throw error;
  }
};

// Fonction d'initialisation de la base de données
export const initializeDatabase = async () => {
  try {
    console.log('🚀 Initialisation de la base de données...');
    await dbConnect();
    console.log('✓ Base de données initialisée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error.message);
    return false;
  }
};

export default dbConnect;
