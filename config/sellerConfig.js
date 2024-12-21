export default {
  // Limites de téléchargement
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFiles: {
      products: 5,
      documents: 1,
      photos: 3
    }
  },

  // Règles métier
  business: {
    minOrderAmount: 1000, // FCFA
    maxProductsPerSeller: 100,
    commissionRate: 0.10, // 10%
    withdrawalMinAmount: 10000, // FCFA
    trialPeriodDays: 30
  },

  // Validation des documents
  documents: {
    required: [
      'idCard',
      'proofOfAddress',
      'taxCertificate',
      'businessRegistration'
    ],
    expiryDays: {
      idCard: 365 * 5, // 5 ans
      taxCertificate: 365, // 1 an
      businessRegistration: 365 * 2 // 2 ans
    }
  },

  // Notifications
  notifications: {
    email: {
      orderReceived: true,
      lowStock: true,
      documentExpiring: true,
      withdrawalProcessed: true
    },
    sms: {
      orderReceived: true,
      withdrawalProcessed: true
    }
  }
}; 