import { Router } from 'express';
import authRoutes from './auth.routes';
// Los siguientes módulos se irán agregando aquí:
import clientesRoutes  from './clientes.routes';
import categoriasRoutes from './categorias.routes';
import productosRoutes from './productos.routes';
import pedidosRoutes   from './pedidos.routes';
import entregasRoutes  from './entregas.routes';
import salidasRoutes from './salidas.routes'
import pagosRoutes     from './pagos.routes';

const router = Router();

router.use('/auth',      authRoutes);
router.use('/clientes',  clientesRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/productos', productosRoutes);
router.use('/pedidos',   pedidosRoutes);
router.use('/entregas',  entregasRoutes);
router.use('/salidas', salidasRoutes)
router.use('/pagos',     pagosRoutes);

export default router;