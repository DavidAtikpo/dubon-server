import express from 'express';
import { login, logout, me } from '../Controllers/AuthController.js';
import { protect} from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/login', login);

router.use(protect);
router.post('/logout', logout);
router.get('/me', me);

export default router; 