import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

export default (sequelize) => {
  const Admin = sequelize.define('Admin', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('superadmin', 'admin'),
      defaultValue: 'admin'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  });

  // Hooks (si nécessaire)
  Admin.beforeCreate(async (admin) => {
    if (admin.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(admin.password, salt);
    }
  });

  // Instance methods
  Admin.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Associations (si nécessaire)
  Admin.associate = (models) => {
    // Définir les associations ici si nécessaire
  };

  return Admin;
};
