import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Rol } from '@bachanetto/shared';
import { productosController, productosValidators } from '../controllers/productos.controller'

const router = Router();

router.use(authenticate);

router.get  ('/',           authorize(Rol.ADMIN, Rol.REPARTIDOR), productosController.listar)
router.get  ('/:id',        authorize(Rol.ADMIN, Rol.REPARTIDOR), productosController.buscarPorId)
router.post ('/',           authorize(Rol.ADMIN), productosValidators.crear,     productosController.crear)
router.put  ('/:id',        authorize(Rol.ADMIN), productosValidators.actualizar, productosController.actualizar)
router.patch('/:id/toggle', authorize(Rol.ADMIN), productosController.toggle)

export default router;