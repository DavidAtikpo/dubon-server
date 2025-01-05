import express from 'express';
import { 
  // adminlogin,
  getDashboard,
  getDashboardStats,
  getUsers,
  getUserById,
  getSellers,
  getSellerById,
  getOrders,
  getSystemSettings,
  updateSystemSettings,
  getSystemLogs,
  getThemes,
  activateTheme,
  deleteTheme,
  uploadTheme,
  updateThemeCustomization,
  startMaintenance,
  endMaintenance,
  performSystemCleanup,
  getMaintenanceStatus,
  getLogs,
  cleanOldLogs,
  getStockStatus,
  getAllFormations,
  getFormationById,
  approveFormation,
  cancelFormation,
  getAllInscriptions,
  confirmInscription,
  cancelInscription,
  getAllEvents,
  getEventById,
  approveEvent,
  cancelEvent,
  getAllEventBookings,
  getEventBookingById,
  confirmEventBooking,
  cancelEventBooking,
  getSellersByType,
  getPendingSellerRequests,
  handleSellerRequest,
  updateSellerStatus,
  updateUserStatus
} from '../Controllers/Admin.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();


// Routes du tableau de bord
router.get('/dashboard', getDashboard);
router.get('/dashboard/stats', getDashboardStats);

// Gestion des utilisateurs
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:userId/status', updateUserStatus);

// Gestion des vendeurs
router.get('/sellers', getSellers);
router.get('/sellers/:id', getSellerById);
router.get('/sellers/type/:type', getSellersByType);
router.get('/sellers/requests/pending', getPendingSellerRequests);
router.put('/sellers/requests/:requestId', handleSellerRequest);
router.put('/sellers/:sellerId/status', updateSellerStatus);

// Gestion des commandes
router.get('/orders', getOrders);

// Gestion des formations
router.get('/formations', getAllFormations);
router.get('/formations/:id', getFormationById);
router.put('/formations/:id/approve', approveFormation);
router.put('/formations/:id/cancel', cancelFormation);

// Gestion des inscriptions
router.get('/inscriptions', getAllInscriptions);
router.put('/inscriptions/:id/confirm', confirmInscription);
router.put('/inscriptions/:id/cancel', cancelInscription);

// Gestion des événements
router.get('/events', getAllEvents);
router.get('/events/:id', getEventById);
router.put('/events/:id/approve', approveEvent);
router.put('/events/:id/cancel', cancelEvent);

// Gestion des réservations d'événements
router.get('/event-bookings', getAllEventBookings);
router.get('/event-bookings/:id', getEventBookingById);
router.put('/event-bookings/:id/confirm', confirmEventBooking);
router.put('/event-bookings/:id/cancel', cancelEventBooking);

// Paramètres système
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);
router.get('/logs', getSystemLogs);
router.delete('/logs/clean', cleanOldLogs);
router.get('/stock-status', getStockStatus);

// Gestion des thèmes
router.get('/themes', getThemes);
router.post('/themes/upload', upload.single('theme'), uploadTheme);
router.put('/themes/:id/activate', activateTheme);
router.delete('/themes/:id', deleteTheme);
router.put('/themes/:id/customize', updateThemeCustomization);

// Maintenance
router.get('/maintenance/status', getMaintenanceStatus);
router.post('/maintenance/start', startMaintenance);
router.post('/maintenance/end', endMaintenance);
router.post('/maintenance/cleanup', performSystemCleanup);
router.get('/system-logs', getLogs);

// Logs système

// Gestion des demandes vendeurs
router.get('/seller-requests', getPendingSellerRequests);
router.put('/seller-requests/:requestId', handleSellerRequest);

export default router;
