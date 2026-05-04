import { Router } from 'express'
import { clientesController, clientesValidators } from '../controllers/clientes.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { Rol } from '@bachanetto/shared'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// GET  /api/clientes
router.get('/',    clientesController.listar)

// GET  /api/clientes/:id
router.get('/:id', clientesController.buscarPorId)

// POST /api/clientes — solo ADMIN
router.post('/',
  authorize(Rol.ADMIN),
  clientesValidators.crear,
  clientesController.crear
)

// PUT  /api/clientes/:id — solo ADMIN
router.put('/:id',
  authorize(Rol.ADMIN),
  clientesValidators.actualizar,
  clientesController.actualizar
)

// DELETE /api/clientes/:id — solo ADMIN
router.delete('/:id',
  authorize(Rol.ADMIN),
  clientesController.desactivar
)

export default router