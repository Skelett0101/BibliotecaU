import { Router } from 'express';
// Importamos todas las funciones del controlador de préstamos
import { 
    obtenerPrestamos, 
    visualizarMisPrestamos, 
    solicitarPrestamo, 
    renovarMiPrestamo 
} from '../controllers/prestamoController';
// Importamos los middlewares de seguridad
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';

const router = Router();

/**
 * RUTAS ADMINISTRATIVAS / EMPLEADO
 * Acceso restringido a roles específicos.
 */
// GET /api/prestamos/ - Obtiene la lista total de préstamos del sistema
router.get('/', verificarToken, verificarRol(['admin', 'empleado']), obtenerPrestamos);

/**
 * RUTAS DE USUARIO (AUTOSERVICIO)
 * Acceso permitido a cualquier usuario autenticado (alumno, maestro, etc.)
 */
// GET /api/prestamos/mis-prestamos - El usuario consulta su historial
router.get('/mis-prestamos', verificarToken, visualizarMisPrestamos);

// POST /api/prestamos/solicitar - El usuario solicita un nuevo préstamo
router.post('/solicitar', verificarToken, solicitarPrestamo);

// PUT /api/prestamos/renovar/:id_prestamo - El usuario extiende la fecha de su préstamo
router.put('/renovar/:id_prestamo', verificarToken, renovarMiPrestamo);

export default router;