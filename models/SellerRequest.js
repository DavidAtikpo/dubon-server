import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class SellerRequest extends Model {}

  SellerRequest.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('individual', 'company'),
      allowNull: false,
      defaultValue: 'individual'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'approved', 'rejected']]
      }
    },
    personalInfo: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      validate: {
        hasRequiredFields(value) {
          if (this.status === 'pending') return; // Skip validation for initial creation
          
          const requiredFields = this.type === 'individual' 
            ? ['fullName', 'address', 'phone', 'email', 'taxNumber', 'idNumber', 'idType']
            : ['companyName', 'rccmNumber', 'legalRepName', 'address', 'phone', 'email', 'taxNumber'];
          
          const missingFields = requiredFields.filter(field => !value[field]);
          if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
          }
        }
      }
    },
    businessInfo: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      validate: {
        hasRequiredFields(value) {
          if (this.status === 'pending') return; // Skip validation for initial creation
          
          const requiredFields = ['shopName', 'category', 'description', 'paymentType', 'paymentDetails'];
          const missingFields = requiredFields.filter(field => !value[field]);
          if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
          }
        }
      }
    },
    documents: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      validate: {
        hasRequiredDocuments(value) {
          if (this.status === 'pending') return; // Skip validation for initial creation
          
          const requiredDocs = this.type === 'individual'
            ? ['idCardUrl', 'proofOfAddressUrl', 'taxCertificateUrl', 'photoUrls', 'shopImageUrl']
            : ['idCardUrl', 'rccmUrl', 'companyStatutesUrl', 'taxCertificateUrl', 'proofOfAddressUrl', 'shopImageUrl'];
          
          const missingDocs = requiredDocs.filter(doc => {
            if (doc === 'photoUrls') {
              return !value[doc] || !Array.isArray(value[doc]) || value[doc].length === 0;
            }
            return !value[doc];
          });
          
          if (missingDocs.length > 0) {
            throw new Error(`Missing required documents: ${missingDocs.join(', ')}`);
          }
        }
      }
    },
    compliance: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        termsAccepted: false,
        qualityStandardsAccepted: false,
        antiCounterfeitingAccepted: false
      },
      validate: {
        hasAcceptedTerms(value) {
          if (this.status === 'pending') return; // Skip validation for initial creation
          
          const required = ['termsAccepted', 'qualityStandardsAccepted', 'antiCounterfeitingAccepted'];
          const notAccepted = required.filter(term => !value[term]);
          if (notAccepted.length > 0) {
            throw new Error(`Terms not accepted: ${notAccepted.join(', ')}`);
          }
        }
      }
    },
    contract: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        signed: false,
        signedAt: null,
        signedDocumentUrl: null
      },
      validate: {
        hasSignedDocument(value) {
          if (this.status === 'pending') return; // Skip validation for initial creation
          
          if (!value.signed || !value.signedDocumentUrl) {
            throw new Error('Signed contract document is required');
          }
        }
      }
    },
    videoVerification: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        completed: false,
        verifiedAt: null,
        verificationVideoUrl: null
      },
      validate: {
        isComplete(value) {
          if (this.status === 'pending') return; // Skip validation for initial creation
          
          if (!value.completed || !value.verificationVideoUrl) {
            throw new Error('Video verification is required');
          }
        }
      }
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'SellerRequest',
    timestamps: true,
    hooks: {
      beforeValidate: (request) => {
        // Ensure all JSON fields are objects
        request.personalInfo = request.personalInfo || {};
        request.businessInfo = request.businessInfo || {};
        request.documents = request.documents || {};
        request.compliance = request.compliance || {
          termsAccepted: false,
          qualityStandardsAccepted: false,
          antiCounterfeitingAccepted: false
        };
        request.contract = request.contract || {
          signed: false,
          signedAt: null,
          signedDocumentUrl: null
        };
        request.videoVerification = request.videoVerification || {
          completed: false,
          verifiedAt: null,
          verificationVideoUrl: null
        };
      }
    }
  });

  SellerRequest.associate = (models) => {
    SellerRequest.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return SellerRequest;
};
