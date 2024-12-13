import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import config from './config/config.js';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';

import authRouter from './Routers/Auth.js';
import userRouter from './Routers/User.js';
import sellerRouter from './Routers/Seller.js';
import adminRouter from './Routers/Admin.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS Configuration
app.use(cors({
  origin: config.ALLOWED_ORIGINS,
  credentials: true
}));

// Body Parser Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create Upload Directories
const uploadDirs = [
  'uploads/documents/id',
  'uploads/documents/address',
  'uploads/documents/tax',
  'uploads/photos',
  'uploads/contracts',
  'uploads/videos',
  'uploads/products',
  'uploads/others'
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/admin', adminRouter);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Une erreur est survenue sur le serveur',
    error: config.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database Connection
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion MongoDB:', err));

// Start Server
app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${config.PORT} en mode ${config.NODE_ENV}`);
});

export default app; 