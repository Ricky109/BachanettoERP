import { Response } from 'express'
import { body, validationResult } from 'express-validator'
import { Turno } from '@bachanetto/shared'
import { ok, created, badRequest, serverError } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import { salidasService } from '../services/salidas.service'

export const salidasValidators = {
  registrar: [
    body('FEC_SAL')
      .notEmpty().withMessage('La fecha es requerida')
      .isISO8601().withMessage('Fecha inválida'),
    body('TUR_SAL')
      .notEmpty().withMessage('El turno es requerido')
      .isIn(Object.values(Turno)).withMessage('Turno inválido'),
    body('items')
      .isArray({ min: 1 }).withMessage('Debe haber al menos un producto'),
    body('items.*.ID_PRD')
      .isInt({ min: 1 }).withMessage('Producto inválido'),
    body('items.*.CAN_SAL')
      .isInt({ min: 1 }).withMessage('La cantidad debe ser mayor a 0'),
  ],
}

export const salidasController = {

  async listar(req: AuthRequest, res: Response) {
    try {
      const fecha = req.query.fecha as string | undefined
      const turno = req.query.turno as string | undefined

      if (!fecha) return badRequest(res, 'La fecha es requerida')

      const data = await salidasService.listar({ fecha, turno })
      return ok(res, data)
    } catch (error) {
      return serverError(res, error)
    }
  },

  async resumen(req: AuthRequest, res: Response) {
    try {
      const fecha = req.query.fecha as string | undefined
      const turno = req.query.turno as string | undefined

      if (!fecha) return badRequest(res, 'La fecha es requerida')
      if (!turno) return badRequest(res, 'El turno es requerido')

      const data = await salidasService.resumen({ fecha, turno })
      return ok(res, data)
    } catch (error) {
      return serverError(res, error)
    }
  },

  async registrar(req: AuthRequest, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Datos inválidos')
    try {
      const data = await salidasService.registrar(req.body)
      return created(res, data, 'Salida registrada correctamente')
    } catch (error) {
      return serverError(res, error)
    }
  },
}