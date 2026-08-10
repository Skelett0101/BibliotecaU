import { Router } from 'express';
// Importamos la función que acabas de crear
import { obtenerPrestamos } from '../controllers/prestamoController';
// Importamos los cadeneros de seguridad (asegúrate de que la ruta sea correcta según tu proyecto)
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';

const router = Router();

// Ruta: GET /api/prestamos
// Protegida: Solo pueden entrar usuarios con token válido que sean 'admin' o 'empleado'
router.get('/', verificarToken, verificarRol(['admin', 'empleado']), obtenerPrestamos);

export default router;