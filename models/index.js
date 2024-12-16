import { Sequelize } from 'sequelize';
import config from '../config/config.js';

// Import des modèles
import User from './User.js';
import Product from './Product.js';
import Cart from './Cart.js';
import Order from './Order.js';
import Rating from './Rating.js';
import Seller from './Seller.js';
import Service from './Service.js';
import Event from './Event.js';
import Training from './Training.js';

const sequelize = new Sequelize(config.database.url, {
  dialect: 'postgres',
  logging: config.database.logging,
  dialectOptions: {
    ssl: {
      require: process.env.DB_SSL === 'true',
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    }
  }
});

// Initialiser les modèles
const models = {
  User,
  Product,
  Cart,
  Order,
  Rating,
  Seller,
  Service,
  Event,
  Training
};

// Initialiser chaque modèle avec sequelize
Object.values(models).forEach(model => {
  if (model.init) {
    model.init(sequelize);
  }
});

// Associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

export { sequelize, models };
export default models; 