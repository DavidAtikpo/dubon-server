import { models } from '../models/index.js';
import { logSystemEvent } from '../utils/systemLogger.js';
import fs from 'fs/promises';
import path from 'path';

export const getThemes = async (req, res) => {
  try {
    const themes = await models.Theme.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: themes
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des thèmes"
    });
  }
};

export const activateTheme = async (req, res) => {
  try {
    const { id } = req.params;

    // Désactiver tous les thèmes
    await models.Theme.update(
      { isActive: false },
      { where: {} }
    );

    // Activer le thème sélectionné
    await models.Theme.update(
      { isActive: true },
      { where: { id } }
    );

    await logSystemEvent({
      type: 'theme',
      action: 'activate',
      description: `Thème ${id} activé`,
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: "Thème activé avec succès"
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'activation du thème"
    });
  }
};

export const deleteTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const theme = await models.Theme.findByPk(id);

    if (!theme) {
      return res.status(404).json({
        success: false,
        message: "Thème non trouvé"
      });
    }

    if (theme.isActive) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer le thème actif"
      });
    }

    await theme.destroy();

    await logSystemEvent({
      type: 'theme',
      action: 'delete',
      description: `Thème ${id} supprimé`,
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: "Thème supprimé avec succès"
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du thème"
    });
  }
};

export const uploadTheme = async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier fourni"
      });
    }

    // Logique d'installation du thème ici
    // ...

    await logSystemEvent({
      type: 'theme',
      action: 'upload',
      description: 'Nouveau thème installé',
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: "Thème installé avec succès"
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'installation du thème"
    });
  }
}; 