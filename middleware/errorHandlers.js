// Gestionnaire d'erreurs CORS
export const corsErrorHandler = (err, req, res, next) => {
  if (err.name === 'CORSError') {
    return res.status(403).json({
      success: false,
      message: 'Erreur CORS: Origine non autorisée',
      error: err.message
    });
  }
  next(err);
};

// Gestionnaire d'erreurs général
export const globalErrorHandler = (err, req, res, next) => {
  console.error('Erreur globale:', err);

  // Erreurs de validation Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Erreurs de base de données
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      message: 'Erreur de base de données',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
    });
  }

  // Erreurs d'authentification JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }

  // Erreurs de fichiers
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Fichier trop volumineux'
    });
  }

  // Erreur par défaut
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
  });
};

export default {
  corsErrorHandler,
  globalErrorHandler
}; 