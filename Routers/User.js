import express from 'express'
import userController from "../Controllers/User.js"
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router()

router.post('/register',userController.register);
router.get('/verify-email/:token', userController.verifyEmail);
router.post('/login',userController.login)
router.post('/logout',authMiddleware.authMiddleware,userController.logout)
router.post('/forgot-password',userController.forgotPassword)
router.put('/update/:id',userController.updatePassword)
router.post('/reset-password/:id',userController.resetPassword)
router.get('/info/:id', userController.userInfo)
router.post('/resend-verification', userController.resendVerificationEmail);

export default router