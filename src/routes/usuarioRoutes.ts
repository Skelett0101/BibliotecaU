import { Router } from 'express';
import { obtenerUsuarios, registrarUsuario, actualizarUsuario } from '../controllers/usuarioController';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/usuarios -> Obtener lista de usuarios
router.get('/', verificarToken, verificarRol(['admin', 'bibliotecario']), obtenerUsuarios);

// POST /api/usuarios -> Crear nuevo usuario
router.post('/', verificarToken, verificarRol(['admin', 'bibliotecario']), registrarUsuario);

// PUT /api/usuarios/:id -> Actualizar usuario (pendiente de implementación)
router.put('/:id', verificarToken, verificarRol(['admin']), actualizarUsuario);

export default router;