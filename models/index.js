import { Sequelize } from 'sequelize';
import config from '../config/config.js';

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

// Définir les modèles
const User = (await import('./User.js')).default(sequelize);
const Product = (await import('./Product.js')).default(sequelize);
const Cart = (await import('./Cart.js')).default(sequelize);
const Order = (await import('./Order.js')).default(sequelize);
const Rating = (await import('./Rating.js')).default(sequelize);
const Seller = (await import('./Seller.js')).default(sequelize);
const Service = (await import('./Service.js')).default(sequelize);
const Event = (await import('./Event.js')).default(sequelize);
const Training = (await import('./Training.js')).default(sequelize);

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

// Associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// Définir les associations spécifiques ici si nécessaire
User.hasMany(Training);
Training.belongsTo(User);

export { sequelize, models };
export default models; 