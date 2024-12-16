// import { Sequelize } from 'sequelize';
// import dotenv from 'dotenv';
// import pg from 'pg';

// // Forcer pg à accepter les certificats auto-signés
// pg.defaults.ssl = {
//   require: true,
//   rejectUnauthorized: false
// };

// // Charger les variables d'environnement
// dotenv.config();

// // Vérifier que l'URL de la base de données est définie
// if (!process.env.DATABASE_URL) {
//   console.error('DATABASE_URL n\'est pas définie dans les variables d\'environnement');
//   process.exit(1);
// }

// // Configuration Sequelize avec SSL
// const sequelizeConfig = {
//   dialect: 'postgres',
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false
//     }
//   },
//   pool: {
//     max: 5,
//     min: 0,
//     acquire: 30000,
//     idle: 10000
//   },
//   logging: false,
//   define: {
//     freezeTableName: true,
//     underscored: true
//   }
// };

// // Créer l'instance Sequelize
// export const sequelize = new Sequelize(process.env.DATABASE_URL, sequelizeConfig);

// // Fonction de connexion à la base de données
// const dbConnect = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('✓ Connection to database has been established successfully.');

//     // Importer les modèles
//     const User = (await import('../models/User.js')).default(sequelize);
//     const Product = (await import('../models/Product.js')).default(sequelize);
//     const Seller = (await import('../models/Seller.js')).default(sequelize);
//     const Order = (await import('../models/Order.js')).default(sequelize);
    
//     console.log('✓ Modèles importés');

//     // Synchroniser sans forcer la recréation
//     if (process.env.NODE_ENV === 'development') {
//       // En développement, utiliser alter pour mettre à jour la structure
//       await sequelize.sync({ alter: true });
//       console.log('✓ Tables mises à jour');
//     } else {
//       // En production, juste vérifier la structure
//       await sequelize.sync();
//       console.log('✓ Structure des tables vérifiée');
//     }

//     // Vérifier les tables
//     const [tables] = await sequelize.query(`
//       SELECT table_name 
//       FROM information_schema.tables 
//       WHERE table_schema = 'public';
//     `);
//     console.log('\nTables existantes:', tables.map(t => t.table_name));

//   } catch (error) {
//     console.error('❌ Erreur de connexion à la base de données:', error);
//     throw error;
//   }
// };

// // Fonction de vérification de la structure
// const checkDatabaseStructure = async () => {
//   try {
//     // Vérifier les tables
//     const [tables] = await sequelize.query(`
//       SELECT table_name 
//       FROM information_schema.tables 
//       WHERE table_schema = 'public';
//     `);

//     if (tables.length === 0) {
//       console.log('❌ Aucune table trouvée, initialisation de la base de données...');
//       await dbConnect();
//       return;
//     }

//     console.log('\n✓ Tables existantes:', tables.map(t => t.table_name));

//     // Vérifier la structure de users
//     if (tables.some(t => t.table_name === 'users')) {
//       const [columns] = await sequelize.query(`
//         SELECT column_name, data_type, column_default, is_nullable
//         FROM information_schema.columns
//         WHERE table_name = 'users'
//         ORDER BY ordinal_position;
//       `);
//       console.log('\n✓ Structure de la table users:', columns);
//     } else {
//       console.log('❌ Table users non trouvée');
//     }

//   } catch (error) {
//     console.error('❌ Erreur lors de la vérification de la base de données:', error);
//     throw error;
//   }
// };

// // Fonction d'initialisation
// export const initializeDatabase = async () => {
//   try {
//     await dbConnect();
//     await checkDatabaseStructure();
//     return true;
//   } catch (error) {
//     console.error('❌ Erreur d\'initialisation de la base de données:', error);
//     return false;
//   }
// };

// // Exports
// export default dbConnect;
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg';

// Forcer `pg` à accepter les certificats auto-signés
pg.defaults.ssl = {
  require: true,
  rejectUnauthorized: false,
};

// Charger les variables d'environnement
dotenv.config();

// Vérification de la variable d'environnement DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas définie dans les variables d\'environnement');
  process.exit(1);
}

// Configuration Sequelize avec SSL
const sequelizeConfig = {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: process.env.NODE_ENV === 'development', // Activer les logs en mode développement
  define: {
    freezeTableName: true,
    underscored: true,
  },
};

// Créer l'instance Sequelize
export const sequelize = new Sequelize(process.env.DATABASE_URL, sequelizeConfig);

// Fonction pour établir la connexion à la base de données
const dbConnect = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Connexion à la base de données établie avec succès.');

    // Importation des modèles
    const models = await Promise.all([
      import('../models/User.js'),
      import('../models/Product.js'),
      import('../models/Seller.js'),
      import('../models/Order.js'),
    ]);
    models.forEach((model) => model.default(sequelize));
    console.log('✓ Modèles importés avec succès.');

    // Synchronisation des modèles avec la base de données
    if (process.env.NODE_ENV === 'development') {
      console.log('⚙️ Mode développement : Synchronisation des tables avec `alter`.');
      await sequelize.sync({ alter: true });
    } else {
      console.log('⚙️ Mode production : Vérification des tables.');
      await sequelize.sync();
    }
    console.log('✓ Synchronisation des modèles terminée.');
  } catch (error) {
    console.error('❌ Erreur lors de la connexion à la base de données:', error.message);
    throw error;
  }
};

// Fonction pour vérifier la structure des tables
const checkDatabaseStructure = async () => {
  try {
    // Liste des tables existantes
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

    if (!tables.length) {
      console.log('❌ Aucune table trouvée dans la base de données.');
      return;
    }
    console.log('✓ Tables existantes :', tables.map((t) => t.table_name));

    // Vérification des colonnes de la table `users` si elle existe
    if (tables.some((t) => t.table_name === 'users')) {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      console.log('✓ Structure de la table `users` :', columns);
    } else {
      console.log('❌ La table `users` n\'existe pas.');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la structure des tables :', error.message);
    throw error;
  }
};

// Fonction principale pour initialiser la base de données
export const initializeDatabase = async () => {
  try {
    console.log('🚀 Initialisation de la base de données...');
    await dbConnect();
    await checkDatabaseStructure();
    console.log('✓ Base de données initialisée avec succès.');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données :', error.message);
    return false;
  }
};

// Export par défaut de la fonction de connexion
export default dbConnect;
