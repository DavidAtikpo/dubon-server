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
      level: severity,
      category: type || 'system',
      message: description,
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'],
      requestMethod: req?.method,
      requestUrl: req?.originalUrl,
      requestParams: req?.params || {},
      environment: process.env.NODE_ENV || 'production'
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
      message: error.message,
      category: 'error',
      level: 'error',
      metadata: {
        stack: error.stack,
        path: req?.path,
        method: req?.method
      },
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'],
      requestMethod: req?.method,
      requestUrl: req?.originalUrl,
      requestParams: req?.params || {},
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (err) {
    console.error('Erreur lors de la journalisation:', err);
  }
}; 