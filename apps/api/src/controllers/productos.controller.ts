import { Response } from 'express'
import { body, validationResult } from 'express-validator'
import { ok, created, badRequest, notFound, serverError } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import { productosService } from '../services/productos.service'

export const productosValidators = {
  crear: [
    body('NOM_PRD').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 150 }).withMessage('Máximo 150 caracteres'),
    body('PRC_STD').isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0'),
    body('ID_CAT').optional({ nullable: true })
      .isInt({ min: 1 }).withMessage('Categoría inválida'),
  ],
  actualizar: [
    body('NOM_PRD').optional().notEmpty().withMessage('El nombre no puede estar vacío')
      .isLength({ max: 150 }).withMessage('Máximo 150 caracteres'),
    body('PRC_STD').optional()
      .isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0'),
    body('ID_CAT').optional({ nullable: true })
      .isInt({ min: 1 }).withMessage('Categoría inválida'),
  ],
}

export const productosController = {

  async listar(req: AuthRequest, res: Response) {
    try {
      const page   = parseInt(req.query.page      as string) || 1
      const limit  = parseInt(req.query.limit     as string) || 20
      const search = req.query.search             as string | undefined
      const idCat  = req.query.categoria ? Number(req.query.categoria) : undefined
      const activo = req.query.activo !== undefined
        ? req.query.activo === 'true'
        : undefined

      const data = await productosService.listar({ page, limit, search, idCat, activo })
      return ok(res, data)
    } catch (error) {
      return serverError(res, error)
    }
  },

  async buscarPorId(req: AuthRequest, res: Response) {
    try {
      const producto = await productosService.buscarPorId(Number(req.params['id']))
      return ok(res, producto)
    } catch (error) {
      if (error instanceof Error && error.message === 'Producto no encontrado') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },

  async crear(req: AuthRequest, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Datos inválidos')

    try {
      const producto = await productosService.crear(req.body)
      return created(res, producto, 'Producto creado correctamente')
    } catch (error) {
      return serverError(res, error)
    }
  },

  async actualizar(req: AuthRequest, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Datos inválidos')

    try {
      const producto = await productosService.actualizar(Number(req.params['id']), req.body)
      return ok(res, producto, 'Producto actualizado correctamente')
    } catch (error) {
      if (error instanceof Error && error.message === 'Producto no encontrado') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },

  async toggle(req: AuthRequest, res: Response) {
    try {
      const producto = await productosService.toggle(Number(req.params['id']))
      return ok(res, producto, `Producto ${producto.ACT_PRD ? 'activado' : 'desactivado'}`)
    } catch (error) {
      if (error instanceof Error && error.message === 'Producto no encontrado') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },
}