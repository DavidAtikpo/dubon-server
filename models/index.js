import { Sequelize } from 'sequelize';
import config from '../config/config.js';

// Import des modèles (sans Training)
import defineProduct from './Product.js';
import defineUser from './User.js';
import defineCart from './Cart.js';
import defineOrder from './Order.js';
import defineRating from './Rating.js';
import defineSeller from './Seller.js';
import defineService from './Service.js';
import defineEvent from './Event.js';

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

// Initialisation des modèles (sans Training)
const cartModels = defineCart(sequelize);
const models = {
  Product: defineProduct(sequelize),
  User: defineUser(sequelize),
  Cart: cartModels.Cart,
  CartItem: cartModels.CartItem,
  Order: defineOrder(sequelize).Order,
  OrderItem: defineOrder(sequelize).OrderItem,
  Rating: defineRating(sequelize),
  Seller: defineSeller(sequelize),
  Service: defineService(sequelize),
  Event: defineEvent(sequelize)
};

// Associations
Object.keys(models).forEach(modelName => {
  if (models[modelName]?.associate) {
    models[modelName].associate(models);
  }
});

// Associations spécifiques avec des alias plus uniques
models.Product.belongsTo(models.User, { 
  as: 'productCreator', 
  foreignKey: 'sellerId' 
});

// Cart associations
models.Cart.belongsTo(models.User, { 
  as: 'cartOwner', 
  foreignKey: 'userId' 
});
models.Cart.belongsToMany(models.Product, { 
  through: models.CartItem,
  foreignKey: 'cartId',
  otherKey: 'productId',
  as: 'productsInCart'
});
models.Product.belongsToMany(models.Cart, { 
  through: models.CartItem,
  foreignKey: 'productId',
  otherKey: 'cartId',
  as: 'containedInCarts'
});

// Order associations
models.Order.belongsTo(models.User, { 
  as: 'purchaser', 
  foreignKey: 'userId' 
});
models.Order.belongsToMany(models.Product, { 
  through: models.OrderItem,
  foreignKey: 'orderId',
  otherKey: 'productId',
  as: 'purchasedProducts'
});
models.Product.belongsToMany(models.Order, {
  through: models.OrderItem,
  foreignKey: 'productId',
  otherKey: 'orderId',
  as: 'purchaseHistory'
});

// Rating associations
models.Rating.belongsTo(models.User, { 
  as: 'reviewer', 
  foreignKey: 'userId' 
});
models.Rating.belongsTo(models.Product, { 
  as: 'reviewedProduct', 
  foreignKey: 'productId' 
});

// Other associations
models.Seller.belongsTo(models.User, { 
  as: 'accountOwner', 
  foreignKey: 'userId' 
});
models.Service.belongsTo(models.User, { 
  as: 'serviceCreator', 
  foreignKey: 'providerId' 
});
models.Event.belongsTo(models.User, { 
  as: 'eventCreator', 
  foreignKey: 'organizerId' 
});

export { sequelize };
export { models };
export default models; 