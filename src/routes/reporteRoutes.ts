import { Router } from 'express';
// Importamos la función de lógica que acabamos de crear
import { obtenerDatosReportePDF, obtenerReporteInventario, obtenerResumenDashboard } from '../controllers/reporteController';
// Importamos los middlewares de seguridad
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';

const router = Router();

router.get('/resumen', verificarToken, verificarRol(['admin', 'bibliotecario']), obtenerResumenDashboard);

// Ruta: GET /api/reportes/inventario
// Seguridad Estricta: Solo puede entrar un usuario con token y rol de 'admin'
router.get('/inventario', verificarToken, verificarRol(['admin']), obtenerReporteInventario);

router.get('/pdf-data', verificarToken, verificarRol(['admin', 'bibliotecario']), obtenerDatosReportePDF);

export default router;