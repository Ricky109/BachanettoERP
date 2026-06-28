import { Response } from 'express'
import { body, validationResult } from 'express-validator'
import { MetodoPago } from '@bachanetto/shared'
import { ok, created, badRequest, notFound, serverError } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import { pagosService } from '../services/pagos.service'

export const pagosValidators = {
  registrar: [
    body('ID_CLI')
      .notEmpty().withMessage('El cliente es requerido')
      .isLength({ min: 8, max: 8 }).withMessage('DNI inválido'),
    body('MON_PAG')
      .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
    body('MET_PAG')
      .notEmpty().withMessage('El método de pago es requerido')
      .isIn(Object.values(MetodoPago)).withMessage('Método de pago inválido'),
    body('FEC_PAG')
      .notEmpty().withMessage('La fecha es requerida')
      .isISO8601().withMessage('Fecha inválida'),
    body('ID_ENT')
      .optional({ nullable: true })
      .isInt({ min: 1 }).withMessage('ID de entrega inválido'),
    body('OBS_PAG')
      .optional({ nullable: true })
      .isLength({ max: 300 }).withMessage('Máximo 300 caracteres'),
  ],
}

export const pagosController = {

  async listarClientes(_req: AuthRequest, res: Response) {
    try {
      const data = await pagosService.listarClientes()
      return ok(res, data)
    } catch (error) {
      return serverError(res, error)
    }
  },

  async saldoCliente(req: AuthRequest, res: Response) {
    try {
      const data = await pagosService.saldoCliente(req.params['id'] as string)
      return ok(res, data)
    } catch (error) {
      if (error instanceof Error && error.message === 'Cliente no encontrado') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },

  async listarPagos(req: AuthRequest, res: Response) {
    try {
      const data = await pagosService.listarPagos(req.params['id'] as string)
      return ok(res, data)
    } catch (error) {
      return serverError(res, error)
    }
  },

  async registrar(req: AuthRequest, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Datos inválidos')
    try {
      const pago = await pagosService.registrar(req.body, req.user!.id)
      return created(res, pago, 'Pago registrado correctamente')
    } catch (error) {
      if (error instanceof Error && error.message === 'Cliente no encontrado') {
        return notFound(res, error.message)
      }
      if (error instanceof Error && error.message === 'Entrega no encontrada') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },
}