import { Router } from 'express';
import { obtenerUsuarios, registrarUsuario } from '../controllers/usuarioController';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/usuarios -> Obtener lista de usuarios
router.get('/', verificarToken, verificarRol(['admin', 'bibliotecario']), obtenerUsuarios);

// POST /api/usuarios -> Crear nuevo usuario
router.post('/', verificarToken, verificarRol(['admin', 'bibliotecario']), registrarUsuario);

export default router;