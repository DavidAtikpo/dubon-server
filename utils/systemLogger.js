import { models } from '../models/index.js';
const { SystemLog } = models;

export const logSystemEvent = async ({
  type,
  action,
  description,
  userId = null,
  metadata = {},
  severity = 'info',
  req = null
}) => {
  try {
    await SystemLog.create({
      type,
      action,
      description,
      userId,
      metadata,
      severity,
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent']
    });
  } catch (error) {
    console.error('Erreur lors de la journalisation:', error);
  }
};

export const logError = async (error, req = null) => {
  try {
    await SystemLog.create({
      type: 'error',
      action: 'system_error',
      description: error.message,
      metadata: {
        stack: error.stack,
        path: req?.path,
        method: req?.method
      },
      severity: 'error',
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent']
    });
  } catch (err) {
    console.error('Erreur lors de la journalisation:', err);
  }
}; 