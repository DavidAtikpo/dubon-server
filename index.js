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
import paymentRoutes from './Routers/payementRoute.js';
import { sequelize, models } from './models/index.js';
import pg from 'pg';
import { initializeDatabase } from './config/dbConfig.js';
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
import subscriptionRoutes from './Routers/seller/subscription.routes.js';


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
      phoneNumber: '',
      address: ''
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
      smtpPassword: process.env.SMTP_PASSWORD || '',
      senderEmail: process.env.SENDER_EMAIL || 'noreply@dubon.com',
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

// Liste de toutes les tables à créer (sauf celles qui existent déjà)
const tablesToCreate = [
  'Product',
  'Service', 
  'Event',
  'RestaurantItem',
  'Restaurant',
  'EventBooking',
  'Reservation',
  'Table',
  'Training',
  'Order',
  'OrderItem',
  'Cart',
  'CartItem',
  'Payment',
  'Return',
  'Refund',
  'Address',
  'Contract',
  'Review',
  'Rating',
  'Message',
  'Notification',
  'Withdrawal',
  'Favorite',
  'Dispute',
  'DisputeEvidence',
  'Coupon',
  'Promotion',
  'PromotionProduct',
  'CustomerFilter',
  'UserActivity'
];

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
app.use('/api/payments', paymentRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/shops', shopRoutes);

// Admin Routes
app.use('/api/admin', Admin);
app.use('/api/admin/themes', themeRoutes);
app.use('/api/admin/system', systemRoutes);
app.use('/api/admin/analytics', analyticsRouter);

// Seller Routes
app.use('/api/seller', Seller);
app.use('/api/seller/subscription', subscriptionRoutes);

// Other Routes
app.use('/api/notifications', notificationsRouter);
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

    // En production, on ne force pas la synchronisation
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
    } else {
      // En production, on vérifie juste la connexion
      await sequelize.authenticate();
    }

    // Configurer les dossiers d'upload
    setupUploadDirectories();

    // Démarrer le serveur
    const PORT = process.env.PORT || 5000;
    try {
      server.listen(PORT, '0.0.0.0', () => {
        console.log('=================================');
        console.log(`✅ Serveur démarré avec succès`);
        console.log(`📡 Port: ${PORT}`);
        console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
        console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configuré' : 'Non configuré'}`);
        console.log(`🗄️ Base de données: ${process.env.DATABASE_URL ? 'Configurée' : 'Non configurée'}`);
        console.log('=================================');
      });
    } catch (error) {
      console.error('❌ Erreur lors du démarrage du serveur:', error);
      process.exit(1);
    }

  } catch (error) {
    console.error('Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

// Démarrer le serveur avec gestion des erreurs
startServer().catch(error => {
  console.error('Erreur fatale au démarrage:', error);
  process.exit(1);
});




