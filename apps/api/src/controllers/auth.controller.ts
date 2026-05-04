import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { ok, badRequest, unauthorized, serverError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth.middleware';

export const authValidators = {
  login: [
    body('email')
      .isEmail().withMessage('Email inválido')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('La contraseña es requerida'),
  ],
};

export const authController = {

  async login(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequest(res, 'Datos inválidos');
    }

    try {
      const result = await authService.login(req.body);
      return ok(res, result, 'Inicio de sesión exitoso');
    } catch (error) {
      if (error instanceof Error &&
          error.message === 'Credenciales incorrectas') {
        return unauthorized(res, 'Credenciales incorrectas');
      }
      return serverError(res, error);
    }
  },

  // Verifica sesión activa — el frontend lo llama al cargar la app
  async me(req: AuthRequest, res: Response) {
    return ok(res, req.user);
  },
};