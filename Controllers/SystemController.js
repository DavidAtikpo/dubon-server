import { models } from '../models/index.js';
import { Op } from 'sequelize';
import os from 'os';
import diskusage from 'disk-usage';
import { exec } from 'child_process';
import nodemailer from 'nodemailer';
import { promisify } from 'util';
import { logSystemEvent } from '../utils/systemLogger.js';
import path from 'path';

const execAsync = promisify(exec);

// Informations système
export const getSystemInfo = async (req, res) => {
  try {
    const dbStats = await sequelize.query(`
      SELECT 
        version() as version,
        pg_database_size(current_database()) as size,
        (SELECT count(*) FROM pg_stat_activity) as connections,
        extract(epoch from current_timestamp - pg_postmaster_start_time()) as uptime
    `);

    const systemInfo = {
      database: {
        version: dbStats[0][0].version.split(' ')[0],
        size: parseInt(dbStats[0][0].size),
        connections: parseInt(dbStats[0][0].connections),
        uptime: parseInt(dbStats[0][0].uptime)
      },
      server: {
        os: `${os.type()} ${os.release()}`,
        nodeVersion: process.version,
        cpuUsage: os.loadavg()[0] * 100 / os.cpus().length,
        memoryUsage: (1 - os.freemem() / os.totalmem()) * 100,
        diskSpace: await getDiskSpace()
      },
      cache: await getCacheStats(),
      email: await getEmailStatus(),
      security: await getSecurityInfo()
    };

    res.status(200).json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    console.error('Erreur système:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des informations système",
      error: error.message
    });
  }
};

// Gestion du cache
export const clearCache = async (req, res) => {
  try {
    await cache.clear();
    await logSystemEvent({
      type: 'system',
      action: 'cache_clear',
      description: 'Cache système vidé',
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: "Cache vidé avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du vidage du cache",
      error: error.message
    });
  }
};

// Test email
export const testEmail = async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: req.user.email,
      subject: 'Test email système',
      text: 'Ceci est un email de test du système.'
    });

    await logSystemEvent({
      type: 'system',
      action: 'email_test',
      description: 'Email de test envoyé avec succès',
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: "Email de test envoyé avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de l'email de test",
      error: error.message
    });
  }
};

// Scan de sécurité
export const securityScan = async (req, res) => {
  try {
    const scanResults = {
      vulnerabilities: [],
      recommendations: []
    };

    // Vérifier les versions des dépendances
    const { stdout: npmAudit } = await execAsync('npm audit --json');
    const auditResults = JSON.parse(npmAudit);
    
    // Vérifier les permissions des fichiers
    const { stdout: filePerms } = await execAsync('find . -type f -perm /o=w');
    
    // Vérifier les ports ouverts
    const { stdout: openPorts } = await execAsync('netstat -tulpn');

    // Analyser et ajouter les résultats
    if (auditResults.vulnerabilities) {
      scanResults.vulnerabilities.push(...Object.values(auditResults.vulnerabilities));
    }

    if (filePerms) {
      scanResults.vulnerabilities.push({
        type: 'file_permissions',
        files: filePerms.split('\n').filter(Boolean)
      });
    }

    await logSystemEvent({
      type: 'security',
      action: 'security_scan',
      description: `Scan de sécurité terminé: ${scanResults.vulnerabilities.length} vulnérabilités trouvées`,
      userId: req.user.id,
      metadata: scanResults
    });

    res.status(200).json({
      success: true,
      data: scanResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du scan de sécurité",
      error: error.message
    });
  }
};

// Gestion des sauvegardes
export const createBackup = async (req, res) => {
  try {
    const { type = 'full' } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, '../backups', `backup-${type}-${timestamp}`);

    await logSystemEvent({
      type: 'system',
      action: 'backup_start',
      description: `Démarrage de la sauvegarde ${type}`,
      userId: req.user.id
    });

    switch (type) {
      case 'database':
        // Sauvegarde de la base de données
        const dbDump = await execAsync(`pg_dump ${process.env.DATABASE_URL} > ${backupPath}.sql`);
        break;
      
      case 'files':
        // Sauvegarde des fichiers
        await execAsync(`tar -czf ${backupPath}.tar.gz uploads/`);
        break;
      
      case 'full':
        // Sauvegarde complète
        await Promise.all([
          execAsync(`pg_dump ${process.env.DATABASE_URL} > ${backupPath}.sql`),
          execAsync(`tar -czf ${backupPath}.tar.gz uploads/ config/`)
        ]);
        break;
    }

    await logSystemEvent({
      type: 'system',
      action: 'backup_complete',
      description: `Sauvegarde ${type} terminée avec succès`,
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: "Sauvegarde créée avec succès"
    });
  } catch (error) {
    await logSystemEvent({
      type: 'system',
      action: 'backup_error',
      description: `Erreur lors de la sauvegarde: ${error.message}`,
      userId: req.user.id,
      severity: 'error'
    });

    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la sauvegarde",
      error: error.message
    });
  }
};

// Optimisation des performances
export const optimizeSystem = async (req, res) => {
  try {
    const optimizations = [];

    // Optimisation de la base de données
    await sequelize.query('VACUUM ANALYZE');
    optimizations.push('Base de données optimisée');

    // Nettoyage des fichiers temporaires
    const tmpFiles = await execAsync('find ./uploads/temp -mtime +7 -type f');
    if (tmpFiles) {
      await execAsync('find ./uploads/temp -mtime +7 -type f -delete');
      optimizations.push('Fichiers temporaires nettoyés');
    }

    // Optimisation du cache
    if (cache) {
      await cache.clean();
      optimizations.push('Cache optimisé');
    }

    await logSystemEvent({
      type: 'system',
      action: 'optimization',
      description: 'Optimisation système effectuée',
      userId: req.user.id,
      metadata: { optimizations }
    });

    res.status(200).json({
      success: true,
      message: "Système optimisé avec succès",
      data: { optimizations }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'optimisation",
      error: error.message
    });
  }
};

// Surveillance des performances
export const getPerformanceMetrics = async (req, res) => {
  try {
    const metrics = {
      system: {
        uptime: os.uptime(),
        loadAvg: os.loadavg(),
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          usage: process.memoryUsage()
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0].model,
          speed: os.cpus()[0].speed
        }
      },
      process: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      database: {
        activeConnections: await getActiveConnections(),
        slowQueries: await getSlowQueries(),
        tableStats: await getTableStats()
      }
    };

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des métriques",
      error: error.message
    });
  }
};

// Fonctions utilitaires
async function getDiskSpace() {
  const root = '/';
  const { total, free } = await diskusage.check(root);
  return {
    total,
    used: total - free,
    free
  };
}

async function getCacheStats() {
  // Implémenter selon votre système de cache
  return {
    type: 'redis', // ou autre
    size: 0,
    hitRate: 0
  };
}

async function getEmailStatus() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.verify();

    return {
      provider: process.env.SMTP_HOST,
      status: 'ok'
    };
  } catch (error) {
    return {
      provider: process.env.SMTP_HOST,
      status: 'error',
      lastError: error.message
    };
  }
}

async function getSecurityInfo() {
  // Implémenter la vérification du certificat SSL et autres contrôles de sécurité
  return {
    sslExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastScan: new Date().toISOString(),
    vulnerabilities: 0
  };
}

// Fonctions utilitaires supplémentaires
async function getActiveConnections() {
  const [result] = await sequelize.query(`
    SELECT count(*) as count 
    FROM pg_stat_activity 
    WHERE state = 'active'
  `);
  return parseInt(result[0].count);
}

async function getSlowQueries() {
  const [result] = await sequelize.query(`
    SELECT query, calls, total_time, mean_time
    FROM pg_stat_statements
    ORDER BY mean_time DESC
    LIMIT 5
  `);
  return result;
}

async function getTableStats() {
  const [result] = await sequelize.query(`
    SELECT 
      relname as table_name,
      n_live_tup as row_count,
      n_dead_tup as dead_rows
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC
  `);
  return result;
}

// Gestion des logs système
export const getSystemLogs = async (req, res) => {
  try {
    const { startDate, endDate, type, severity, limit = 100 } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (type) where.type = type;
    if (severity) where.severity = severity;

    const logs = await models.SystemLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      include: [{
        model: models.User,
        attributes: ['name', 'email']
      }]
    });

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des logs",
      error: error.message
    });
  }
};

// Maintenance du système
export const startMaintenance = async (req, res) => {
  try {
    const { reason, estimatedDuration } = req.body;

    // Activer le mode maintenance
    await models.SystemSettings.upsert({
      key: 'maintenance_mode',
      value: {
        active: true,
        reason,
        estimatedDuration,
        startedAt: new Date(),
        startedBy: req.user.id
      }
    });

    // Déconnecter tous les utilisateurs non-admin
    await models.Session.destroy({
      where: {
        userId: {
          [Op.notIn]: await models.User.findAll({
            where: { role: 'admin' },
            attributes: ['id']
          }).map(user => user.id)
        }
      }
    });

    await logSystemEvent({
      type: 'system',
      action: 'maintenance_start',
      description: `Mode maintenance activé: ${reason}`,
      userId: req.user.id,
      severity: 'warning'
    });

    res.status(200).json({
      success: true,
      message: "Mode maintenance activé"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'activation du mode maintenance",
      error: error.message
    });
  }
};

export const endMaintenance = async (req, res) => {
  try {
    await models.SystemSettings.upsert({
      key: 'maintenance_mode',
      value: {
        active: false,
        endedAt: new Date(),
        endedBy: req.user.id
      }
    });

    await logSystemEvent({
      type: 'system',
      action: 'maintenance_end',
      description: 'Mode maintenance désactivé',
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: "Mode maintenance désactivé"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la désactivation du mode maintenance",
      error: error.message
    });
  }
};

// Nettoyage du système
export const cleanupSystem = async (req, res) => {
  try {
    const cleanupTasks = [];

    // Nettoyer les sessions expirées
    const expiredSessions = await models.Session.destroy({
      where: {
        expires: { [Op.lt]: new Date() }
      }
    });
    cleanupTasks.push(`${expiredSessions} sessions expirées supprimées`);

    // Nettoyer les fichiers temporaires
    const { stdout: deletedFiles } = await execAsync('find ./uploads/temp -mtime +7 -type f -delete -print | wc -l');
    cleanupTasks.push(`${deletedFiles.trim()} fichiers temporaires supprimés`);

    // Nettoyer les logs anciens
    const oldLogs = await models.SystemLog.destroy({
      where: {
        createdAt: {
          [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
        },
        severity: {
          [Op.notIn]: ['error', 'critical']
        }
      }
    });
    cleanupTasks.push(`${oldLogs} logs anciens supprimés`);

    await logSystemEvent({
      type: 'system',
      action: 'cleanup',
      description: 'Nettoyage système effectué',
      userId: req.user.id,
      metadata: { cleanupTasks }
    });

    res.status(200).json({
      success: true,
      message: "Nettoyage système effectué",
      data: { tasks: cleanupTasks }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du nettoyage système",
      error: error.message
    });
  }
}; 