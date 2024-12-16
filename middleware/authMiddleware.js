import User from "../models/User.js";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token non fourni'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// authorization by admin
const isAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.user;
  const adminUser = await User.findOne({ email }); // Use findOne instead of find

  if (!adminUser || adminUser.role !== 'admin') {
    // Check if adminUser is not found or role is not admin
    throw new Error("You are not an admin");
  } else {
    next();
  }
});

const authorization = asyncHandler(async (req, res, next) => {
  let token;

  // Vérifiez si le token est présent dans les en-têtes
  if (req?.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    console.log("Token reçu :", token);
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        // Vérifiez si l'utilisateur existe
        if (!user) {
          return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        if (user.role !== 'vendeur') {
          return res.status(403).json({ message: "Accès refusé : vous devez être un vendeur pour effectuer cette action" });
        }

        req.user = user;
        next();
      }
    } catch (error) {
      // Gestion des erreurs de token
      if (error.name === 'TokenExpiredError') {
        console.error("Erreur lors de la vérification du token :", error);
        return res.status(401).json({ message: "Token expiré, veuillez vous reconnecter" });
      } else {
        console.error("Erreur lors de la vérification du token :", error);
        return res.status(401).json({ message: "Token invalide, veuillez vous reconnecter" });
      }
    }
  } else {
    return res.status(401).json({ message: "Aucun token fourni" });
  }
});

export const verifyAdmin = async (req, res, next) => {
  console.log("\n=== DÉBUT VÉRIFICATION ADMIN ===");
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log("Token extrait:", token);

    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token décodé:", decoded);

      const user = await User.findById(decoded.id);
      console.log("Utilisateur trouvé:", user);

      if (!user) {
        return res.status(404).json({ 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Not authorized as admin',
          code: 'NOT_ADMIN'
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification admin:", error);
    return res.status(401).json({ 
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  console.log("=== FIN VÉRIFICATION ADMIN ===\n");
};

export const verifyToken = asyncHandler(async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log("Token reçu:", token);
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token non fourni' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token décodé:", decoded);

    const user = await User.findById(decoded.id);
    console.log("User trouvé:", user);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur complète d\'authentification:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Token invalide',
      error: error.message
    });
  }
});

// Ajouter la gestion des erreurs CORS
const corsErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré',
      error: err.message
    });
  } else {
    next(err);
  }
};

// Exporter le middleware
export { corsErrorHandler };

export default{authMiddleware,isAdmin,verifyAdmin,authorization}