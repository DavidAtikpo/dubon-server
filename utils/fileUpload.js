import fs from 'fs';
import path from 'path';

export const uploadFile = async (file, folder) => {
  try {
    // Créer le dossier s'il n'existe pas
    const uploadDir = path.join('uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Générer le chemin du fichier
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(uploadDir, filename);

    // Écrire le fichier
    await fs.promises.writeFile(filepath, file.buffer);

    // Retourner le chemin relatif
    return path.join(folder, filename);
  } catch (error) {
    console.error('Erreur upload fichier:', error);
    throw new Error('Erreur lors de l\'upload du fichier');
  }
};

export const deleteFile = async (filepath) => {
  try {
    if (filepath) {
      const fullPath = path.join('uploads', filepath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    }
  } catch (error) {
    console.error('Erreur suppression fichier:', error);
  }
}; 