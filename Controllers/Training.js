import Training from "../models/Training.js";

// Créer une nouvelle formation
const createTraining = async (req, res) => {
  try {
    const { accountName, country, timezone, educationLevel } = req.body;

    // Vérifiez les champs obligatoires
    if (!accountName || !educationLevel || !req.files.document || !req.files.signature) {
      return res.status(400).json({ message: "Tous les champs sont obligatoires." });
    }

    // Créer et enregistrer le dossier
    const dossier = new Dossier({
      accountName,
      country,
      timezone,
      educationLevel,
      documentPath: req.files.document[0].path,
      signaturePath: req.files.signature[0].path,
    });

    await dossier.save();

    res.status(201).json({ message: "Dossier enregistré avec succès !" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'enregistrement du dossier." });
  }
};


// Récupérer toutes les formations
 const getAllTrainings = async (req, res) => {
  try {
    const trainings = await Training.find();
    res.status(200).json(trainings);
  } catch (error) {
    console.error("Erreur lors de la récupération des formations :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Récupérer une formation par ID
 const getTrainingById = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id).populate("participants", "name email");
    if (!training) {
      return res.status(404).json({ message: "Formation non trouvée." });
    }
    res.status(200).json(training);
  } catch (error) {
    console.error("Erreur lors de la récupération de la formation :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Mettre à jour une formation
 const updateTraining = async (req, res) => {
  try {
    const updatedTraining = await Training.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedTraining) {
      return res.status(404).json({ message: "Formation non trouvée." });
    }
    res.status(200).json(updatedTraining);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la formation :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Supprimer une formation
 const deleteTraining = async (req, res) => {
  try {
    const deletedTraining = await Training.findByIdAndDelete(req.params.id);
    if (!deletedTraining) {
      return res.status(404).json({ message: "Formation non trouvée." });
    }
    res.status(200).json({ message: "Formation supprimée avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de la formation :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Ajouter un participant à une formation
 const addParticipant = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: "Formation non trouvée." });
    }
    if (!training.participants.includes(req.body.userId)) {
      training.participants.push(req.body.userId);
      await training.save();
    }
    res.status(200).json({ message: "Participant ajouté avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'ajout du participant :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

export default {createTraining,getAllTrainings,getTrainingById,updateTraining,addParticipant,deleteTraining}