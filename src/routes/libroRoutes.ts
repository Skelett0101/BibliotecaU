// Archivo: src/routes/libroRoutes.ts
import { Router } from 'express';
import { registrarLibro, eliminarLibro } from '../controllers/libroController';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';

const router = Router();

// Permitimos que tanto 'bibliotecario' como 'becario' puedan crear y eliminar libros
router.post('/', verificarToken, verificarRol(['bibliotecario', 'admin']), registrarLibro);

router.delete('/:id', verificarToken, verificarRol(['bibliotecario', 'admin']), eliminarLibro);

export default router;