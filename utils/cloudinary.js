import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Fonction pour uploader une image
export const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'restaurants',
      use_filename: true
    });
    return result;
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw new Error('Erreur lors de l\'upload de l\'image');
  }
};

export default cloudinary; 