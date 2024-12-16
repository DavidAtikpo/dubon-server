import jwt from'jsonwebtoken';
import config from '../config/config.js';

const generateToken = (id) => {
  if (!config.jwt.secret) {
    throw new Error('JWT_SECRET n\'est pas défini dans les variables d\'environnement');
  }
  
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expire
  });
};

export default generateToken;
