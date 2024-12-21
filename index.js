import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import bodyParser from "body-parser";
import express from "express";
import http from 'http';
// import dbConnect from "./config/dbConfig.js";
import Order from './Routers/Order.js'
import User from './Routers/User.js'
import errorHandler from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import Products from './Routers/Products.js'
import morgan from "morgan";
import cors from 'cors';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import cartRoute from './Routers/cartRoute.js';

import Training from './Routers/Training.js'
import searchRouter from './Routers/searchRouter.js'
import category from './Routers/category.js'
import Seller from "./Routers/Seller.js"
import Event from './Routers/Event.js'
import paymentRoutes from './Routers/payementRoute.js';
import { sequelize } from './config/dbConfig.js';
import pg from 'pg';
import { initializeDatabase } from './config/dbConfig.js';
import adminRoutes from './Routers/admin.js'
import { logError } from './utils/systemLogger.js';
import systemRoutes from './Routers/system.js';
import themeRoutes from './Routers/themes.js';
import disputeRoutes from './Routers/disputes.js';
import wishlistRoute from './Routers/wishlist.js';

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

// Initialiser la base de données avant de démarrer le serveur
const startServer = async () => {
  try {
    // Synchroniser les modèles avec la base de données de manière sécurisée
    await sequelize.sync();  // Sans { alter: true } ni { force: true } en production
    console.log('✓ Base de données synchronisée');

    // Initialiser la base de données
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('Échec de l\'initialisation de la base de données');
      process.exit(1);
    }

    // Configurer les middlewares et les routes
    // ... reste de la configuration ...

    // Démarrer le serveur
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running at PORT ${PORT}`);
    });
  } catch (error) {
    console.error('Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

// Routes
app.get("/", (req, res) => {
    res.json("Hello")
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/user", User);

app.use("/api/product", Products);
// app.use("/api", Seller);
app.use("/api", Training);
app.use('/api/category', category);
app.use('/api/orders', Order);
app.use("/api", Event);
app.use("/api/", cartRoute);
app.use('/api/wishlist', wishlistRoute);
app.use('/api', searchRouter);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/system', systemRoutes);
// Use admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/themes', themeRoutes);
app.use('/api/disputes', disputeRoutes);

// Monter les routes
app.use('/api/seller', Seller);

// Error handling
app.use(errorHandler.notFound);
app.use(errorHandler.errorHandler);

// Middleware de gestion des erreurs globales
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
    'uploads/documents/id',
    'uploads/documents/address',
    'uploads/documents/tax',
    'uploads/photos',
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
      console.log(`Created upload directory: ${fullPath}`);
    }
  });
};

// Appeler la fonction au démarrage
setupUploadDirectories();

// Désactiver le timeout du serveur pour les uploads longs
server.timeout = 300000; // 5 minutes

// Au démarrage du serveur
const testDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Connexion à la base de données OK');

    // Vérifier les tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Tables existantes:', tables.map(t => t.table_name));

    // Vérifier les utilisateurs
    const [users] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users;
    `);
    console.log('Nombre d\'utilisateurs:', users[0].count);

  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    process.exit(1);
  }
};

testDatabaseConnection();




