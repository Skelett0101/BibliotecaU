import { Router } from 'express';
// Importamos todas las funciones del controlador de préstamos
import { 
    obtenerPrestamos, 
    visualizarMisPrestamos,  
    renovarMiPrestamo,
    autorizarPrestamo, 
    actualizarPrestamoAdmin,
    solicitarPrestamoAlumno
} from '../controllers/prestamoController';
// Importamos los middlewares de seguridad
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';

const router = Router();

/**
 * RUTAS ADMINISTRATIVAS / EMPLEADO
 * Acceso exclusivo para Admin y Bibliotecario.
 */
router.get('/', verificarToken, verificarRol(['admin', 'bibliotecario']), obtenerPrestamos);
router.put('/actualizar/:id_prestamo', verificarToken, verificarRol(['admin', 'bibliotecario']), actualizarPrestamoAdmin);
/**
 * RUTAS DE USUARIO (AUTOSERVICIO)
 */
router.get('/mis-prestamos', verificarToken, visualizarMisPrestamos);
router.put('/renovar/:id_prestamo', verificarToken, renovarMiPrestamo);
router.post('/autorizar', verificarToken, verificarRol(['admin', 'bibliotecario']), autorizarPrestamo);
router.post('/solicitar', verificarToken, solicitarPrestamoAlumno);

export default router;