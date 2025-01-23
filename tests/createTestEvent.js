import { models } from '../models/index.js';

async function getFirstUser() {
  try {
    const user = await models.User.findOne();
    if (!user) {
      throw new Error('Aucun utilisateur trouvé dans la base de données');
    }
    return user;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw error;
  }
}

async function createTestEvent() {
  try {
    const user = await getFirstUser();
    console.log('Utilisateur trouvé:', user.id);

    const event = await models.Event.create({
      title: "Événement Test",
      description: "Ceci est un événement de test",
      type: "upcoming",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours dans le futur
      images: ["https://example.com/placeholder.jpg"],
      sellerId: user.id
    });

    console.log('Événement de test créé avec succès:', event.toJSON());
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement de test:', error);
  } finally {
    process.exit();
  }
}

createTestEvent(); 