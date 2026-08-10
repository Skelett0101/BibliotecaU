import { Router } from 'express';
import { 
    obtenerReporteInventario, 
    obtenerReporteAtrasos, 
    obtenerReporteLibrosTotales, 
    obtenerReporteIngresos 
} from '../controllers/reporteController';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas de reportes avanzados son exclusivas del Administrador
router.get('/inventario', verificarToken, verificarRol(['admin']), obtenerReporteInventario);
router.get('/atrasos', verificarToken, verificarRol(['admin']), obtenerReporteAtrasos);
router.get('/libros-totales', verificarToken, verificarRol(['admin']), obtenerReporteLibrosTotales);
router.get('/ingresos', verificarToken, verificarRol(['admin']), obtenerReporteIngresos);

export default router;