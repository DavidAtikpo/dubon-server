import { sequelize } from '../models/index.js';

async function migrate() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Base de données synchronisée');
  } catch (error) {
    console.error('Erreur de migration:', error);
  }
}

migrate(); 