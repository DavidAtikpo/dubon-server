import express from 'express'
import User from "../Controllers/User.js"
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router()

router.post('/register',User.register);
router.get('/verify-email/:token', User.verifyEmail);
router.post('/login',User.login)
router.post('/logout',authMiddleware.authMiddleware,User.logout)
router.post('/forgot-password',User.forgotPassword)
router.put('/update/:id',User.updatePassword)
router.post('/reset-password/:id',User.resetPassword)
router.get('/info/:id', User.userInfo)

export default router