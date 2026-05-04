import { Response } from 'express';
import { ApiResponse } from '@bachanetto/shared';

export const ok = <T>(res: Response, data: T, message?: string) => {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  return res.status(200).json(body);
};

export const created = <T>(res: Response, data: T, message?: string) => {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  return res.status(201).json(body);
};

export const badRequest = (res: Response, message: string, errors?: Record<string, string[]>) => {
  const body: ApiResponse = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(400).json(body);
};

export const unauthorized = (res: Response, message = 'No autorizado') =>
  res.status(401).json({ success: false, message });

export const forbidden = (res: Response, message = 'Acceso denegado') =>
  res.status(403).json({ success: false, message });

export const notFound = (res: Response, message = 'Recurso no encontrado') =>
  res.status(404).json({ success: false, message });

export const conflict = (res: Response, message: string) =>
  res.status(409).json({ success: false, message });

export const serverError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error interno del servidor';
  console.error('[ERROR]', error);
  return res.status(500).json({ success: false, message });
};