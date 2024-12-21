import { models } from '../models/index.js';

export const getActiveTheme = async (req, res) => {
  try {
    const theme = await models.Theme.findOne({
      where: { isActive: true }
    });
    res.json({ success: true, data: theme });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPublicThemes = async (req, res) => {
  try {
    const themes = await models.Theme.findAll({
      where: { isSystem: false }
    });
    res.json({ success: true, data: themes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserThemePreference = async (req, res) => {
  try {
    const preference = await models.UserPreference.findOne({
      where: { userId: req.user.id }
    });
    res.json({ success: true, data: preference?.theme || 'default' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUserThemePreference = async (req, res) => {
  try {
    await models.UserPreference.upsert({
      userId: req.user.id,
      theme: req.body.theme
    });
    res.json({ success: true, message: 'Préférence mise à jour' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createTheme = async (req, res) => {
  try {
    const theme = await models.Theme.create(req.body);
    res.status(201).json({ success: true, data: theme });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTheme = async (req, res) => {
  try {
    await models.Theme.update(req.body, {
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Thème mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteTheme = async (req, res) => {
  try {
    await models.Theme.destroy({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Thème supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const activateTheme = async (req, res) => {
  try {
    await models.Theme.update({ isActive: false }, { where: {} });
    await models.Theme.update({ isActive: true }, {
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Thème activé' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deactivateTheme = async (req, res) => {
  try {
    await models.Theme.update({ isActive: false }, {
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Thème désactivé' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}; 