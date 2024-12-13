import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dubon',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-default-secret-key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  
  // FedaPay Configuration
  FEDAPAY_PUBLIC_KEY: process.env.FEDAPAY_PUBLIC_KEY,
  FEDAPAY_SECRET_KEY: process.env.FEDAPAY_SECRET_KEY,
  FEDAPAY_SANDBOX: process.env.FEDAPAY_SANDBOX === 'true',
  
  // Cors Configuration
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000']
};

export default config; 