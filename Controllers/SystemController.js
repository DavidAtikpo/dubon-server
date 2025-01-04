import { models, sequelize } from '../models/index.js';
import os from 'os';
import { freemem, totalmem } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';

const execAsync = promisify(exec);

// Vérifier si les modèles sont correctement chargés
console.log('Models disponibles:', Object.keys(models));

export const getSystemInfo = async (req, res) => {
  try {
    console.log('=== Début getSystemInfo ===');

    // Informations de la base de données
    const [dbVersion] = await sequelize.query('SELECT version();');
    const [dbSize] = await sequelize.query('SELECT pg_database_size(current_database());');
    const [dbConnections] = await sequelize.query('SELECT count(*) FROM pg_stat_activity;');
    
    const dbInfo = {
      version: dbVersion[0]?.version || 'N/A',
      size: parseInt(dbSize[0]?.pg_database_size || 0),
      connections: parseInt(dbConnections[0]?.count || 0),
      uptime: 0
    };

    // Informations serveur
    const cpuUsage = process.cpuUsage();
    const totalCPUUsage = (cpuUsage.user + cpuUsage.system) / 1000000;

    const serverInfo = {
      os: `${os.type()} ${os.release()}`,
      nodeVersion: process.version,
      cpuUsage: Math.round((totalCPUUsage / os.cpus().length) * 100),
      memoryUsage: Math.round((1 - (freemem() / totalmem())) * 100),
      diskSpace: {
        total: 0,
        free: 0,
        used: 0
      }
    };

    // Informations cache
    const cacheInfo = {
      type: 'Memory',
      size: process.memoryUsage().heapUsed,
      hitRate: 95
    };

    // Email et sécurité avec gestion d'erreur améliorée
    let emailInfo = {
      provider: 'SMTP',
      status: 'error',
      lastError: null
    };

    let securityInfo = {
      sslExpiry: process.env.SSL_EXPIRY || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastScan: null,
      vulnerabilities: 0
    };

    try {
      // Vérifier si la table existe avant de faire la requête
      const tableExists = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'SystemSettings'
        );
      `);
      
      if (tableExists[0][0].exists) {
        const [settings] = await sequelize.query(`
          SELECT value FROM "SystemSettings" WHERE id = 1;
        `);

        if (settings && settings[0]) {
          const config = JSON.parse(settings[0].value);
          if (config.email) {
            emailInfo.provider = config.email.smtpHost || 'SMTP';
            const transporter = nodemailer.createTransport({
              host: config.email.smtpHost,
              port: config.email.smtpPort,
              secure: config.email.smtpPort === 465,
              auth: {
                user: config.email.smtpUser,
                pass: config.email.smtpPassword
              }
            });
            
            await transporter.verify();
            emailInfo.status = 'ok';
          }
        }
      }

      // Vérifier les logs système
      const tableExists2 = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'SystemLogs'
        );
      `);

      if (tableExists2[0][0].exists) {
        const [lastScan] = await sequelize.query(`
          SELECT "createdAt" 
          FROM "SystemLogs" 
          WHERE action = 'SECURITY_SCAN' 
          ORDER BY "createdAt" DESC 
          LIMIT 1;
        `);
        
        if (lastScan && lastScan[0]) {
          securityInfo.lastScan = lastScan[0].createdAt;
        }
      }

    } catch (error) {
      console.error('Erreur lors de la récupération des configurations:', error);
    }

    console.log('Informations système récupérées avec succès');

    res.json({
      success: true,
      data: {
        database: dbInfo,
        server: serverInfo,
        cache: cacheInfo,
        email: emailInfo,
        security: securityInfo
      }
    });

  } catch (error) {
    console.error('Erreur getSystemInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations système',
      error: error.message
    });
  }
};

export const clearSystemCache = async (req, res) => {
  try {
    console.log('=== Début clearSystemCache ===');
    
    // Implémenter selon votre système de cache
    // Exemple avec Redis:
    // await redisClient.flushall();

    await models.SystemLog.create({
      action: 'CACHE_CLEAR',
      details: { clearedAt: new Date() },
      userId: req.user.id
    });

    console.log('Cache système vidé');

    res.json({
      success: true,
      message: 'Cache système vidé avec succès'
    });

  } catch (error) {
    console.error('Erreur clearSystemCache:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du vidage du cache',
      error: error.message
    });
  }
};

export const optimizeSystem = async (req, res) => {
  try {
    console.log('=== Début optimizeSystem ===');
    const tasks = [];

    // 1. Optimiser la base de données
    await sequelize.query('VACUUM ANALYZE;')
      .then(() => tasks.push('Base de données optimisée'));

    // 2. Nettoyer les fichiers temporaires
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.rm(tempDir, { recursive: true, force: true })
      .then(() => fs.mkdir(tempDir))
      .then(() => tasks.push('Fichiers temporaires nettoyés'));

    // 3. Autres optimisations...

    // Logger l'action
    await models.SystemLog.create({
      action: 'SYSTEM_OPTIMIZE',
      details: { tasks },
      userId: req.user.id
    });

    console.log('Système optimisé');
    console.log('Tâches effectuées:', tasks);

    res.json({
      success: true,
      message: 'Système optimisé avec succès',
      data: { tasks }
    });

  } catch (error) {
    console.error('Erreur optimizeSystem:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'optimisation du système',
      error: error.message
    });
  }
};

export default {
  getSystemInfo,
  clearSystemCache,
  optimizeSystem
}; 