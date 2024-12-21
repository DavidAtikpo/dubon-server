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
  logging: false
};

// Création de l'instance Sequelize
export const sequelize = new Sequelize(dbUrl, sequelizeConfig);

console.log('🔌 Tentative de connexion à la base de données...');

export default sequelize;


