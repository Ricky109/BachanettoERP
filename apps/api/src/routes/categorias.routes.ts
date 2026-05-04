import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Rol } from '@bachanetto/shared';
import { categoriasController, categoriasValidators } from '../controllers/categorias.controller'

const router = Router();

router.use(authenticate);

router.get ('/',    authorize(Rol.ADMIN, Rol.REPARTIDOR), categoriasController.listar)
router.post('/',    authorize(Rol.ADMIN), categoriasValidators.crear,     categoriasController.crear)
router.put ('/:id', authorize(Rol.ADMIN), categoriasValidators.actualizar, categoriasController.actualizar)

export default router;