import { Response } from 'express'
import { body, query, validationResult } from 'express-validator'
import { Turno } from '@bachanetto/shared'
import { ok, created, badRequest, notFound, serverError } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import { pedidosService } from '../services/pedidos.service'

export const pedidosValidators = {
  crear: [
    body('ID_CLI')
      .notEmpty().withMessage('El cliente es requerido')
      .isLength({ min: 8, max: 8 }).withMessage('DNI inválido'),
    body('FEC_ENT_PED')
      .notEmpty().withMessage('La fecha de entrega es requerida')
      .isISO8601().withMessage('Fecha inválida'),
    body('TUR_PED')
      .optional()
      .isIn(Object.values(Turno)).withMessage('Turno inválido'),
    body('detalles')
      .isArray({ min: 1 }).withMessage('El pedido debe tener al menos un producto'),
    body('detalles.*.ID_PRD')
      .isInt({ min: 1 }).withMessage('Producto inválido'),
    body('detalles.*.CAN')
      .isInt({ min: 1 }).withMessage('La cantidad debe ser mayor a 0'),
    body('detalles.*.PRC_UNI')
      .isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0'),
  ],
  actualizar: [
    body('FEC_ENT_PED')
      .optional()
      .isISO8601().withMessage('Fecha inválida'),
    body('TUR_PED')
      .optional()
      .isIn(Object.values(Turno)).withMessage('Turno inválido'),
    body('detalles')
      .optional()
      .isArray({ min: 1 }).withMessage('El pedido debe tener al menos un producto'),
    body('detalles.*.ID_PRD')
      .optional()
      .isInt({ min: 1 }).withMessage('Producto inválido'),
    body('detalles.*.CAN')
      .optional()
      .isInt({ min: 1 }).withMessage('La cantidad debe ser mayor a 0'),
    body('detalles.*.PRC_UNI')
      .optional()
      .isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0'),
  ],
}

export const pedidosController = {

  async listar(req: AuthRequest, res: Response) {
    try {
      const fecha  = req.query.fecha  as string | undefined
      const search = req.query.search as string | undefined
      const rol    = req.user!.rol

      const data = await pedidosService.listar({ fecha, search, rol })
      return ok(res, data)
    } catch (error) {
      return serverError(res, error)
    }
  },

  async buscarPorId(req: AuthRequest, res: Response) {
    try {
      const pedido = await pedidosService.buscarPorId(Number(req.params['id']))
      return ok(res, pedido)
    } catch (error) {
      if (error instanceof Error && error.message === 'Pedido no encontrado') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },

  async productosPactados(req: AuthRequest, res: Response) {
    try {
      const data = await pedidosService.productosPactados(req.params['idCli'] as string)
      return ok(res, data)
    } catch (error) {
      if (error instanceof Error && error.message === 'Cliente no encontrado') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },

  async crear(req: AuthRequest, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Datos inválidos')

    try {
      const pedido = await pedidosService.crear(req.body, req.user!.id)
      return created(res, pedido, 'Pedido creado correctamente')
    } catch (error) {
      if (error instanceof Error && error.message === 'Cliente no encontrado') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },

  async actualizar(req: AuthRequest, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Datos inválidos')

    try {
      const pedido = await pedidosService.actualizar(Number(req.params['id']), req.body)
      return ok(res, pedido, 'Pedido actualizado correctamente')
    } catch (error) {
      if (error instanceof Error && error.message === 'Pedido no encontrado') {
        return notFound(res, error.message)
      }
      if (error instanceof Error && error.message.includes('Solo se pueden editar')) {
        return badRequest(res, error.message)
      }
      return serverError(res, error)
    }
  },

  async actualizarPrecioPactado(req: AuthRequest, res: Response) {
    try {
        const { idCli, idPrd } = req.params
        const { precio } = req.body

        if (!precio || isNaN(Number(precio)) || Number(precio) < 0) {
            return badRequest(res, 'El precio es requerido y debe ser mayor o igual a 0')
        }

        const data = await pedidosService.actualizarPrecioPactado(idCli as string, Number(idPrd), Number(precio))
        return ok(res, data, 'Precio pactado actualizado correctamente')
    } catch (error) {
        if (error instanceof Error && error.message === 'Cliente no encontrado') {
            return notFound(res, error.message)
        }
        if (error instanceof Error && error.message === 'Producto no encontrado') {
            return notFound(res, error.message)
        }
        return serverError(res, error)
    }
  },

  async cancelar(req: AuthRequest, res: Response) {
    try {
      const pedido = await pedidosService.cancelar(Number(req.params['id']))
      return ok(res, pedido, 'Pedido cancelado correctamente')
    } catch (error) {
      if (error instanceof Error && error.message === 'Pedido no encontrado') {
        return notFound(res, error.message)
      }
      if (error instanceof Error && error.message.includes('Solo se pueden cancelar')) {
        return badRequest(res, error.message)
      }
      return serverError(res, error)
    }
  },
}