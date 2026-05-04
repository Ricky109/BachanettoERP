import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Rol } from '@bachanetto/shared';
import { env } from '../config/env';
import { unauthorized, forbidden } from '../utils/response';

// Extiende Request para incluir el usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    id:     string;
    email:  string;
    rol:    Rol;
    nombre: string;
  };
}

interface JwtPayload {
  sub:    string;
  email:  string;
  rol:    Rol;
  nombre: string;
  iat:    number;
  exp:    number;
}

// Verifica el token JWT en el header Authorization: Bearer <token>
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(res, 'Token no proporcionado');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id:     payload.sub,
      email:  payload.email,
      rol:    payload.rol,
      nombre: payload.nombre,
    };
    next();
  } catch {
    return unauthorized(res, 'Token inválido o expirado');
  }
};

// Uso: authorize(Rol.ADMIN) o authorize(Rol.ADMIN, Rol.REPARTIDOR)
export const authorize =
  (...roles: Rol[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res);
    if (!roles.includes(req.user.rol)) {
      return forbidden(res, 'No tienes permisos para esta acción');
    }
    next();
  };