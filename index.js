import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import bodyParser from "body-parser";
import express from "express";
import http from 'http';
import Order from './Routers/Order.js'
import User from './Routers/User.js'
import errorHandler from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import Products from './Routers/Products.js'
import morgan from "morgan";
import cors from 'cors';
// import authRoutes from './Routers/auth.js';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import cartRoute from './Routers/cartRoute.js';

import Training from './Routers/Training.js'
import searchRouter from './Routers/searchRouter.js'
import category from './Routers/category.js'
import Seller from "./Routers/Seller.js"
import Event from './Routers/Event.js'
import paymentRoutes from './Routers/paymentRoute.js';
import { sequelize, syncModels } from './models/index.js';
import pg from 'pg';
// import { initializeDatabase } from './config/dbConfig.js';
import Admin from './Routers/Admin.js';
import { logError } from './utils/systemLogger.js';
import systemRoutes from './Routers/system.js';
import themeRoutes from './Routers/themes.js';
import disputeRoutes from './Routers/disputes.js';
import wishlistRoute from './Routers/wishlist.js';
import analyticsRouter from './Routers/analytics.js';
import systemRouter from './Routers/system.js';
import restaurantRoutes from './Routers/Restaurant.js';
import eventRoutes from './Routers/Event.js';
import notificationsRouter from './Routers/NotificationsRouter.js';
// import dishesRoutes from './routes/seller/dishes';
import shopRoutes from './Routers/Shop.js';

import subscriptionRoutes from './Routers/subscription.js';


// Charger les variables d'environnement
dotenv.config();

// Log pour debug
console.log('Variables d\'environnement chargées:', {
  EMAIL: process.env.EMAIL ? 'Défini' : 'Non défini',
  PASSWORD: process.env.PASSWORD ? 'Défini' : 'Non défini',
  NODE_ENV: process.env.NODE_ENV
});

// Initialize dotenv with absolute path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Express
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialiser le store de session PostgreSQL d'abord
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

const SessionStore = pgSession(session);
const sessionStore = new SessionStore({
  pool,
  createTableIfMissing: true
});

// Vérifier que JWT_SECRET est défini
const JWT_SECRET = process.env.JWT_SECRET || 'anotherstrategickey';
console.log('Using JWT_SECRET:', JWT_SECRET ? 'Defined' : 'Not defined');

// Configurations principales
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors({
  origin: ['https://dubonservice.com', 'http://localhost:3000', 'https://www.dubonservice.com'],
  credentials: true
}));

// Configuration de la session APRÈS avoir initialisé sessionStore
app.use(session({
  store: sessionStore,
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

const defaultSystemSettings = {
  key: 'general_settings',
  value: {
    general: {
      siteName: 'Dubon',
      siteDescription: 'Plateforme de commerce en ligne',
      contactEmail: 'contact@dubon.com',
      phoneNumber: '+228 97 22 22 22',
      address: 'Cotonou, Benin'
    },
    features: {
      enableRegistration: true,
      enableReviews: true,
      enableChat: true,
      maintenanceMode: false
    },
    email: {
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER || '',
      smtpPassword: process.env.SMTP_PASSWORD || 'dnpj hiab ddjv lqmi',
      senderEmail: process.env.SENDER_EMAIL || 'davidatikpo@gmail.com',
      senderName: 'Dubon'
    },
    social: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    }
  },
  category: 'general',
  description: 'Paramètres généraux du système'
};

// Fonction pour vérifier et rétablir la connexion
const checkDatabaseConnection = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✓ Connexion à la base de données OK');
      return true;
    } catch (error) {
      console.error(`Tentative ${i + 1}/${retries} échouée:`, error.message);
      if (i < retries - 1) {
        console.log('Nouvelle tentative dans 5 secondes...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  return false;
};

// Routes
app.get("/", (req, res) => {
    res.json("Hello")
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use("/api/user", User);
app.use("/api/products", Products);
app.use("/api", Training);
app.use('/api/category', category);
app.use('/api/orders', Order);
app.use("/api", Event);
app.use("/api/", cartRoute);
app.use('/api/wishlist', wishlistRoute);
app.use('/api', searchRouter);
app.use('/api/payment', paymentRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/shops', shopRoutes);

// Subscription Routes
app.use('/api/subscription', subscriptionRoutes);

// Admin Routes
app.use('/api/admin', Admin);
app.use('/api/admin/themes', themeRoutes);
app.use('/api/admin/system', systemRoutes);
app.use('/api/admin/analytics', analyticsRouter);

// Seller Routes
app.use('/api/seller', Seller);


// Other Routes
app.use('/api/disputes', disputeRoutes);

// Error handling middlewares
app.use(errorHandler.notFound);
app.use(errorHandler.errorHandler);
app.use((error, req, res, next) => {
  logError(error, req);
  res.status(500).json({
    success: false,
    message: "Une erreur est survenue",
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Fonction pour configurer les dossiers d'upload
const setupUploadDirectories = () => {
  const dirs = [
    'uploads/photos',
    'uploads/photos/temp',
    'uploads/documents/id',
    'uploads/documents/address',
    'uploads/documents/tax',
    'uploads/contracts',
    'uploads/videos',
    'uploads/others',
    'uploads/products',
    'uploads/themes'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${fullPath}`);
    }
  });
};

// Désactiver le timeout du serveur pour les uploads longs
server.timeout = 300000; // 5 minutes

const startServer = async () => {
  try {
    // Vérifier la connexion
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Impossible de se connecter à la base de données');
    }

    // console.log('🔄 Suppression et recréation de toutes les tables...');
    
    // // Désactiver les contraintes de clé étrangère temporairement
    // await sequelize.query('SET CONSTRAINTS ALL DEFERRED');
    
    // // Forcer la suppression et recréation de toutes les tables
    // await sequelize.sync({ force: true });
    
    // // Réactiver les contraintes
    // await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE');
    
    // console.log('✅ Tables recréées avec succès');

    // Configurer les dossiers d'upload
    setupUploadDirectories();

    // Démarrer le serveur
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log('=================================');
      console.log(`✅ Serveur démarré avec succès`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
      console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configuré' : 'Non configuré'}`);
      console.log('=================================');
    });

  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

// Fonction pour initialiser les données par défaut
const initializeDefaultData = async () => {
  try {
    console.log('📝 Initialisation des données par défaut...');
    // Ajoutez ici l'initialisation des données par défaut si nécessaire
    console.log('✅ Données initialisées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des données:', error);
    throw error;
  }
};

// Démarrer le serveur avec gestion des erreurs
startServer().catch(error => {
  console.error('Erreur fatale au démarrage:', error);
  process.exit(1);
});




