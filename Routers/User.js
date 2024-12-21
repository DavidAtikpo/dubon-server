import express from 'express'
import userController from "../Controllers/User.js"
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router()

router.post('/register',userController.register);
router.get('/verify-email/:token', userController.verifyEmail);
router.post('/login',userController.login)
router.post('/logout',authMiddleware,userController.logout)
router.post('/forgot-password',userController.forgotPassword)
router.put('/update/:id',userController.updatePassword)
router.post('/reset-password/:id',userController.resetPassword)
// Dans routes/user.js
router.get('/info', authMiddleware, userController.getUserInfo);
router.put('/update', authMiddleware, userController.updateUserInfo);
router.get('/payment-stats', authMiddleware, userController.getPaymentStats);
router.post('/resend-verification', userController.resendVerificationEmail);
router.get('/orders', authMiddleware, userController.getUserOrders);
router.get('/profile', authMiddleware, userController.getUserProfile);
router.post('/address', authMiddleware, userController.addUserAddress);
router.put('/preferences', authMiddleware, userController.updateUserPreferences);
router.post('/favorites/toggle', authMiddleware, userController.toggleFavorite);
router.get('/activity', authMiddleware, userController.getUserActivity);
router.put('/social-profile', authMiddleware, userController.updateSocialProfile);
router.get('/stats', authMiddleware, userController.getUserStats);
router.get('/dashboard', authMiddleware, userController.getUserDashboard);
router.get('/favorites', authMiddleware, userController.getFavorites);
router.get('/activity', authMiddleware, userController.getUserActivity);

export default router