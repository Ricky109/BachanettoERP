import { Response } from 'express'
import { body, param, validationResult } from 'express-validator'
import { clientesService } from '../services/clientes.service'
import { ok, created, badRequest, notFound, conflict, serverError } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'

export const clientesValidators = {
  crear: [
    body('ID_CLI').isLength({ min: 8, max: 8 }).withMessage('El DNI debe tener 8 caracteres'),
    body('NOM_CLI').notEmpty().withMessage('El nombre es requerido'),
    body('LIM_MON_CLI').optional().isDecimal().withMessage('Monto inválido'),
    body('LIM_DIA_CLI').optional().isInt({ min: 1 }).withMessage('Días inválido'),
  ],
  actualizar: [
    param('id').isLength({ min: 8, max: 8 }).withMessage('DNI inválido'),
    body('NOM_CLI').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('LIM_MON_CLI').optional({ nullable: true }).isDecimal().withMessage('Monto inválido'),
    body('LIM_DIA_CLI').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Días inválido'),
  ],
}

export const clientesController = {

  async listar(req: AuthRequest, res: Response) {
    try {
      const search = req.query.search as string | undefined
      const incluirInactivos = req.query.incluirInactivos === 'true'
      const data = await clientesService.listar(search, incluirInactivos)
      return ok(res, data)
    } catch (error) {
      return serverError(res, error)
    }
  },

  async buscarPorId(req: AuthRequest, res: Response) {
    try {
      const cliente = await clientesService.buscarPorId(req.params['id'] as string)
      if (!cliente) return notFound(res, 'Cliente no encontrado')
      return ok(res, cliente)
    } catch (error) {
      return serverError(res, error)
    }
  },

  async crear(req: AuthRequest, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Datos inválidos')

    try {
      const cliente = await clientesService.crear(req.body)
      return created(res, cliente, 'Cliente creado correctamente')
    } catch (error) {
      if (error instanceof Error && error.message.includes('Ya existe')) {
        return conflict(res, error.message)
      }
      return serverError(res, error)
    }
  },

  async actualizar(req: AuthRequest, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Datos inválidos')

    try {
      const cliente = await clientesService.actualizar(req.params['id'] as string, req.body)
      return ok(res, cliente, 'Cliente actualizado correctamente')
    } catch (error) {
      if (error instanceof Error && error.message === 'Cliente no encontrado') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },

  async toggle(req: AuthRequest, res: Response) {
    try {
      const cliente = await clientesService.toggle(req.params['id'] as string)
      return ok(res, cliente, `Cliente ${cliente.ACT_CLI ? 'activado' : 'desactivado'} correctamente`)
    } catch (error) {
      if (error instanceof Error && error.message === 'Cliente no encontrado') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },
}