import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { Rol } from '@bachanetto/shared'
import { pedidosController, pedidosValidators } from '../controllers/pedidos.controller'

const router = Router()

router.use(authenticate)

// Rutas estáticas PRIMERO — antes que cualquier /:id
router.get('/productos-pactados/:idCli',
  authorize(Rol.ADMIN),
  pedidosController.productosPactados
)

router.patch('/productos-pactados/:idCli/:idPrd',
  authorize(Rol.ADMIN),
  pedidosController.actualizarPrecioPactado
)

// Lectura — ADMIN y REPARTIDOR
router.get('/',
  authorize(Rol.ADMIN, Rol.REPARTIDOR),
  pedidosController.listar
)

router.get('/:id',
  authorize(Rol.ADMIN, Rol.REPARTIDOR),
  pedidosController.buscarPorId
)

// Escritura — solo ADMIN
router.post('/',
  authorize(Rol.ADMIN),
  pedidosValidators.crear,
  pedidosController.crear
)

router.put('/:id',
  authorize(Rol.ADMIN),
  pedidosValidators.actualizar,
  pedidosController.actualizar
)

router.patch('/:id/cancelar',
  authorize(Rol.ADMIN),
  pedidosController.cancelar
)

export default router