import { Router } from 'express';
import { obtenerUsuarios, registrarUsuarioPanel } from '../controllers/adminController';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';

const router = Router();

// Ruta para obtener la lista de usuarios
router.get('/usuarios', verificarToken, verificarRol(['admin', 'bibliotecario']), obtenerUsuarios);

// Ruta para registrar usuarios desde el panel
router.post('/registrar-usuario', verificarToken, verificarRol(['admin', 'bibliotecario']), registrarUsuarioPanel);

export default router;