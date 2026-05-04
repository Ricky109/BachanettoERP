import { Router } from 'express';
import { authController, authValidators } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/login
router.post('/login', authValidators.login, authController.login);

// GET /api/auth/me  — verifica sesión activa
router.get('/me', authenticate, authController.me);

export default router;