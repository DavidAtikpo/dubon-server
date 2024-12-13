import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  name: String,
  description: String,
  price: Number,
  images: [String],
  category: String,
  stock: Number,
  paymentMethods: [{
    type: String,
    enum: ['mobile_money', 'card', 'bank_transfer', 'fedapay']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const sellerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['individual', 'company'],
    required: true
  },
  personalInfo: {
    fullName: String,
    email: String,
    phone: String,
    address: String,
    companyName: String,
    idNumber: String,
    taxNumber: String,
    legalRepName: String,
    rccmNumber: String
  },
  documents: {
    idCard: String,
    proofOfAddress: String,
    taxCertificate: String,
    photos: [String],
    rccm: String,
    companyStatutes: String
  },
  contract: {
    signed: Boolean,
    signedDocument: String
  },
  videoVerification: {
    completed: Boolean,
    recordingUrl: String
  },
  businessInfo: {
    category: String,
    description: String,
    products: [{
      name: String,
      description: String,
      price: Number,
      images: [String]
    }],
    bankDetails: {
      type: {
        type: String,
        enum: ['bank', 'mobile']
      },
      accountNumber: String,
      bankName: String
    },
    returnPolicy: String
  },
  compliance: {
    termsAccepted: Boolean,
    qualityStandardsAccepted: Boolean,
    antiCounterfeitingAccepted: Boolean
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  validation: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    message: String,
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  subscription: {
    plan: {
      type: String,
      enum: ['trial', 'monthly', 'yearly', 'premium'],
      default: 'trial'
    },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active'
    }
  }
});

// Middleware pour mettre à jour updatedAt avant chaque sauvegarde
sellerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Seller', sellerSchema);
  