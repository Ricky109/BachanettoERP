import { Response } from 'express'
import { body, validationResult } from 'express-validator'
import { ok, created, badRequest, notFound, serverError } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import { categoriasService } from '../services/categorias.service'

export const categoriasValidators = {
  crear: [
    body('NOM_CAT').notEmpty().withMessage('El nombre es requerido')
      .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
    body('DES_CAT').optional({ nullable: true })
      .isLength({ max: 300 }).withMessage('Máximo 300 caracteres'),
  ],
  actualizar: [
    body('NOM_CAT').optional().notEmpty().withMessage('El nombre no puede estar vacío')
      .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
    body('DES_CAT').optional({ nullable: true })
      .isLength({ max: 300 }).withMessage('Máximo 300 caracteres'),
  ],
}

export const categoriasController = {

  async listar(_req: AuthRequest, res: Response) {
    try {
      const data = await categoriasService.listar()
      return ok(res, data)
    } catch (error) {
      return serverError(res, error)
    }
  },

  async crear(req: AuthRequest, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Datos inválidos')

    try {
      const categoria = await categoriasService.crear(req.body)
      return created(res, categoria, 'Categoría creada correctamente')
    } catch (error) {
      return serverError(res, error)
    }
  },

  async actualizar(req: AuthRequest, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Datos inválidos')

    try {
      const categoria = await categoriasService.actualizar(Number(req.params['id']), req.body)
      return ok(res, categoria, 'Categoría actualizada correctamente')
    } catch (error) {
      if (error instanceof Error && error.message === 'Categoría no encontrada') {
        return notFound(res, error.message)
      }
      return serverError(res, error)
    }
  },
}