import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { Rol } from '@bachanetto/shared'
import { pagosController, pagosValidators } from '../controllers/pagos.controller'

const router = Router()

router.use(authenticate)

// Rutas estáticas ANTES que las dinámicas
router.get('/clientes',
  authorize(Rol.ADMIN),
  pagosController.listarClientes
)

router.get('/clientes/:id/saldo',
  authorize(Rol.ADMIN, Rol.REPARTIDOR),
  pagosController.saldoCliente
)

router.get('/clientes/:id/pagos',
  authorize(Rol.ADMIN),
  pagosController.listarPagos
)

router.post('/',
  authorize(Rol.ADMIN, Rol.REPARTIDOR),
  pagosValidators.registrar,
  pagosController.registrar
)

export default router