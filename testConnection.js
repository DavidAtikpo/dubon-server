import { sequelize } from './config/dbConfig.js';

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection à la base de données réussie!');
    
    // Test une requête simple
    const result = await sequelize.query('SELECT NOW()');
    console.log('Heure du serveur:', result[0][0].now);
  } catch (error) {
    console.error('Erreur de connexion:', error);
  } finally {
    await sequelize.close();
  }
}

testConnection(); 