import { Router } from 'express';
import { obtenerRecargos, actualizarRecargo, obtenerMisRecargos } from '../controllers/recargoController';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';

const router = Router();

router.get('/mis-recargos', verificarToken, obtenerMisRecargos);



router.get('/', verificarToken, verificarRol(['admin', 'bibliotecario']), obtenerRecargos);
router.put('/:id', verificarToken, verificarRol(['admin', 'bibliotecario']), actualizarRecargo);

export default router;