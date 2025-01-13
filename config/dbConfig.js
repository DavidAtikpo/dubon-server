import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

// Configure pg to handle big integers as numbers instead of strings
pg.defaults.parseInt8 = true;

const config = {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    connectTimeout: 60000
  },
  pool: {
    max: 2,
    min: 0,
    acquire: 60000,
    idle: 30000
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
};

export const sequelize = new Sequelize(process.env.DATABASE_URL, config);

const createUuidExtension = async () => {
  try {
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('✓ UUID extension enabled');
  } catch (error) {
    console.error('Failed to create UUID extension:', error.message);
    throw error;
  }
};

export const checkDatabaseConnection = async () => {
  console.log('Attempting database connection...');
  console.log('Environment:', process.env.NODE_ENV);
  
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    try {
      await sequelize.authenticate();
      console.log('✓ Database connection successful');
      await createUuidExtension();
      return true;
    } catch (error) {
      console.error(`Connection attempt ${attempts}/${maxAttempts} failed:`, {
        message: error.message,
        code: error.original?.code,
        errno: error.original?.errno
      });

      if (attempts < maxAttempts) {
        console.log(`Waiting 5 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  return false;
};