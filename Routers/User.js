import express from 'express'
import passport from '../config/passport.js';
import User from "../Controllers/User.js"
// import userValidator from '../validators/userValidator.js'
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router()

router.post('/register',User.register);
router.get('/verify-email/:token', User.verifyEmail);
router.post('/login',User.login)
router.post('/logout',authMiddleware.authMiddleware,User.logout)
router.post('/forgot-password',User.forgotPassword)
router.put('/update/:id',User.updatePassword)
router.post('/reset-password/:id',User.resetPassword)
router.get('/info/:id'), User.userInfo

// Route de redirection vers Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/dashboard'); 
    }
);
// Route de redirection vers facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', 
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/dashboard'); 
    }
);



export default router