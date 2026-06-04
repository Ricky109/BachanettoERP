import { Response } from 'express'
import { body, validationResult } from 'express-validator'
import { Turno } from '@bachanetto/shared'
import { ok, created, badRequest, notFound, serverError } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import { entregasService } from '../services/entregas.service'

export const entregasValidators = {
  crear: [
    body('ID_CLI')
      .notEmpty().withMessage('El cliente es requerido')
      .isLength({ min: 8, max: 8 }).withMessage('DNI inválido'),
    body('FEC_ENT')
      .notEmpty().withMessage('La fecha es requerida')
      .isISO8601().withMessage('Fecha inválida'),
    body('TUR_ENT')
      .notEmpty().withMessage('El turno es requerido')
      .isIn(Object.values(Turno)).withMessage('Turno inválido'),
    body('ID_PED')
      .optional({ nullable: true })
      .isInt({ min: 1 }).withMessage('ID de pedido inválido'),
    body('detalles')
      .isArray({ min: 1 }).withMessage('La entrega debe tener al menos un producto'),
    body('detalles.*.ID_PRD')
      .isInt({ min: 1 }).withMessage('Producto inválido'),
    body('detalles.*.CAN')
      .isInt({ min: 1 }).withMessage('La cantidad debe ser mayor a 0'),
    body('detalles.*.CAN_CAM')
      .isInt({ min: 0 }).withMessage('Los cambios no pueden ser negativos'),
    body('detalles.*.PRC_UNI')
      .isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0'),
  ],
}

export const entregasController = {

  async listar(req: AuthRequest, res: Response) {
    try {
      const fecha = req.query.fecha as string | undefined
      const rol   = req.user!.rol
      const data  = await entregasService.listar({ fecha, rol })
      return ok(res, data)
    } catch (error) {
      return serverError(res, error)
    }
  },

  async buscarPorId(req: AuthRequest, res: Response) {
    try {
      const entrega = await entregasService.buscarPorId(Number(req.params['id'] as string))
      return ok(res, entrega)
    } catch (error) {
      if (error instanceof Error && error.message === 'Entrega no encontrada') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },

  async crear(req: AuthRequest, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Datos inválidos')
    try {
      const entrega = await entregasService.crear(req.body, req.user!.id)
      return created(res, entrega, 'Entrega registrada correctamente')
    } catch (error) {
      if (error instanceof Error && error.message === 'Entrega no encontrada') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },
}