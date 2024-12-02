import express from 'express'
// import passport from '../config/passport.js';
import User from "../Controllers/User.js"
// import userValidator from '../validators/userValidator.js'
import authMiddleware from '../middleware/authMiddleware.js';
// import passport from '../config/passport.js';

const router = express.Router()

router.post('/register',User.register);
router.get('/verify-email/:token', User.verifyEmail);
router.post('/login',User.login)
router.post('/logout',authMiddleware.authMiddleware,User.logout)
router.post('/forgot-password',User.forgotPassword)
router.put('/update/:id',User.updatePassword)
router.post('/reset-password/:id',User.resetPassword)
router.get('/info/:id'), User.userInfo

// // Routes Google OAuth
// router.get('/auth/google', 
//     passport.authenticate('google', { 
//         scope: ['profile', 'email'],
//         session: true 
//     })
// );

// router.get('/auth/google/callback', 
//     passport.authenticate('google', { 
//         failureRedirect: '/login',
//         session: true
//     }),
//     (req, res) => {
//         res.redirect('/dashboard');
//     }
// );

// // Routes Facebook OAuth
// router.get('/auth/facebook', 
//     passport.authenticate('facebook', { 
//         scope: ['email'],
//         session: true 
//     })
// );

// router.get('/auth/facebook/callback', 
//     passport.authenticate('facebook', { 
//         failureRedirect: '/login',
//         session: true
//     }),
//     (req, res) => {
//         res.redirect('/dashboard');
//     }
// );

export default router