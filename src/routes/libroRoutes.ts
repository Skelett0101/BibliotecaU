// Archivo: src/routes/libroRoutes.ts
import { Router } from 'express';
import { registrarLibro, cambiarEstadoEjemplar, editarLibro, actualizarEstadoFisico, buscarLibros, buscarLibrosAlumnos } from '../controllers/libroController';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';
import { obtenerCategorias, crearCategoria, editarCategoria, obtenerAutores, crearAutor } from '../controllers/libroController';

const router = Router();

// ==========================================
// RUTAS PÚBLICAS (Solo requieren Token válido)
// ==========================================
router.get('/', verificarToken, buscarLibros);
router.get('/buscar', verificarToken, buscarLibros);
router.get('/categorias', verificarToken, obtenerCategorias);
router.get('/autores', verificarToken, obtenerAutores);
router.get('/:id', verificarToken, buscarLibrosAlumnos); 

// ==========================================
// RUTAS PRIVADAS (Admin y Bibliotecario)
// ==========================================
// Categorías
router.post('/categorias', verificarToken, verificarRol(['admin', 'bibliotecario']), crearCategoria);
router.put('/categorias/:id', verificarToken, verificarRol(['admin', 'bibliotecario']), editarCategoria);

// Autores
router.post('/autores', verificarToken, verificarRol(['admin', 'bibliotecario']), crearAutor);

// Gestión Principal de Libros
router.post('/', verificarToken, verificarRol(['admin', 'bibliotecario']), registrarLibro);
router.put('/:id', verificarToken, verificarRol(['admin', 'bibliotecario']), editarLibro);

// Ejemplares Físicos
router.patch('/ejemplar/:id_ejemplar/estado', verificarToken, verificarRol(['admin', 'bibliotecario']), cambiarEstadoEjemplar);
router.put('/ejemplares/actualizar-estado', verificarToken, verificarRol(['admin', 'bibliotecario']), actualizarEstadoFisico);

export default router;