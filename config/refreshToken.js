
import jwt from "jsonwebtoken";

const generateRefreshToken = (id) => {
  // Vérifiez que la clé est bien chargée
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET must be defined in the environment variables");
  }

  // Créez le token avec la clé secrète
  return jwt.sign({ id }, secret, {
    expiresIn: "1h", // Token expirera après 1 heure
  });
};

export default generateRefreshToken;
