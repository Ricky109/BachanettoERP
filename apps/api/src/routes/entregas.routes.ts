import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { Rol } from '@bachanetto/shared'
import { entregasController, entregasValidators } from '../controllers/entregas.controller'

const router = Router()

router.use(authenticate)

router.get('/',
  authorize(Rol.ADMIN, Rol.REPARTIDOR),
  entregasController.listar
)

router.get('/:id',
  authorize(Rol.ADMIN, Rol.REPARTIDOR),
  entregasController.buscarPorId
)

router.post('/',
  authorize(Rol.ADMIN, Rol.REPARTIDOR),
  entregasValidators.crear,
  entregasController.crear
)

export default router