import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dubon',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif','mp4'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
  }
});

export const upload = multer({ storage: storage });
export default cloudinary; 