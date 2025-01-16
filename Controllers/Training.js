import { models } from '../models/index.js';
const { Training } = models;

// Créer une nouvelle formation
const createTraining = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      duration,
      startDate,
      maxParticipants,
      location,
      category,
      level,
      prerequisites,
      objectives
    } = req.body;

    // Vérifier les fichiers
    if (!req.files || !req.files.image || !req.files.syllabus) {
      return res.status(400).json({
        success: false,
        message: "L'image et le syllabus sont requis"
      });
    }

    // Créer la formation avec les chemins des fichiers
    const training = await Training.create({
      title,
      description,
      price: parseFloat(price),
      duration,
      startDate,
      maxParticipants: parseInt(maxParticipants),
      location,
      category,
      level,
      prerequisites,
      objectives,
      image: req.files.image[0].path.replace(/\\/g, '/'),
      syllabus: req.files.syllabus[0].path.replace(/\\/g, '/')
    });

    res.status(201).json({
      success: true,
      message: "Formation créée avec succès",
      data: training
    });
  } catch (error) {
    console.error("Erreur lors de la création de la formation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la formation",
      error: error.message
    });
  }
};

// Récupérer toutes les formations
const getAllTrainings = async (req, res) => {
  try {
    const trainings = await Training.findAll({
      order: [['createdAt', 'DESC']]
    });

    const formattedTrainings = trainings.map(training => {
      const data = training.get({ plain: true });
      if (data.image) {
        data.image = `${process.env.BASE_URL}/${data.image}`;
      }
      if (data.syllabus) {
        data.syllabus = `${process.env.BASE_URL}/${data.syllabus}`;
      }
      return data;
    });

    res.status(200).json({
      success: true,
      data: formattedTrainings
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des formations:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des formations",
      error: error.message
    });
  }
};

// Récupérer une formation par ID
const getTrainingById = async (req, res) => {
  try {
    const training = await Training.findByPk(req.params.id);
    
    if (!training) {
      return res.status(404).json({
        success: false,
        message: "Formation non trouvée"
      });
    }
    
    // Transformer les chemins d'images en URLs complètes
    const plainTraining = training.get({ plain: true });
    const formattedTraining = {
      ...plainTraining,
      image: `${process.env.BASE_URL}/${plainTraining.image}`,
      syllabus: `${process.env.BASE_URL}/${plainTraining.syllabus}`
    };
    
    res.json({
      success: true,
      data: formattedTraining
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la formation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la formation",
      error: error.message
    });
  }
};

// Mettre à jour une formation
const updateTraining = async (req, res) => {
  try {
    const [updated] = await Training.update(req.body, {
      where: { id: req.params.id }
    });

    if (updated) {
      const updatedTraining = await Training.findByPk(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Formation mise à jour avec succès",
        data: updatedTraining
      });
    }

    return res.status(404).json({
      success: false,
      message: "Formation non trouvée"
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la formation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la formation",
      error: error.message
    });
  }
};

// Supprimer une formation
const deleteTraining = async (req, res) => {
  try {
    const deleted = await Training.destroy({
      where: { id: req.params.id }
    });

    if (deleted) {
      return res.status(200).json({
        success: true,
        message: "Formation supprimée avec succès"
      });
    }

    return res.status(404).json({
      success: false,
      message: "Formation non trouvée"
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la formation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la formation",
      error: error.message
    });
  }
};

// Ajouter un participant à une formation
const addParticipant = async (req, res) => {
  try {
    const training = await Training.findByPk(req.params.id);
    
    if (!training) {
      return res.status(404).json({
        success: false,
        message: "Formation non trouvée"
      });
    }

    // Logique pour ajouter un participant
    // À implémenter selon votre modèle de données

    res.status(200).json({
      success: true,
      message: "Participant ajouté avec succès"
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du participant:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout du participant",
      error: error.message
    });
  }
};

export default {
  createTraining,
  getAllTrainings,
  getTrainingById,
  updateTraining,
  addParticipant,
  deleteTraining
}