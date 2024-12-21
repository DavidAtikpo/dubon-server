import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'production'
  },

  // Database Configuration
  database: {
    url: `${process.env.DATABASE_URL}?sslmode=require`,
    logging: false,
    dialect: 'postgres',
    dialectOptions: {
      ssl: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'anotherstrategickey',
    expire: process.env.JWT_EXPIRE || '7d'
  },

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  },

  // Payment Configuration
  payment: {
    fedapay: {
      publicKey: process.env.FEDAPAY_PUBLIC_KEY,
      secretKey: process.env.FEDAPAY_SECRET_KEY,
      sandbox: process.env.NODE_ENV !== 'production'
    },
    momo: {
      apiKey: process.env.MOMO_API_KEY,
      userId: process.env.MOMO_API_USER_ID,
      baseUrl: process.env.MOMO_API_BASE_URL
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      mode: process.env.PAYPAL_MODE || 'sandbox'
    }
  },

  // Upload Configuration
  upload: {
    path: process.env.UPLOAD_PATH || 'uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '50000000')
  },

  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://dubonservice.com',

  // OAuth Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET
    }
  },

  // CORS Configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://dubonservice.com',
    credentials: true
  }
};

// Configuration Sequelize avec SSL
const sequelizeConfig = {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    keepAlive: true,
  },
  ssl: true, // Ajout explicite du SSL au niveau supérieur
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: process.env.NODE_ENV === 'production',
  define: {
    freezeTableName: true,
    underscored: true,
  },
};

export default config; 