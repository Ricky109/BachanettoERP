import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { Rol } from '@bachanetto/shared'
import { salidasController, salidasValidators } from '../controllers/salidas.controller'

const router = Router()

router.use(authenticate)

// Ruta estática ANTES que las dinámicas
router.get('/resumen',
  authorize(Rol.ADMIN, Rol.REPARTIDOR),
  salidasController.resumen
)

router.get('/',
  authorize(Rol.ADMIN, Rol.REPARTIDOR),
  salidasController.listar
)

router.post('/',
  authorize(Rol.ADMIN),
  salidasValidators.registrar,
  salidasController.registrar
)

export default router