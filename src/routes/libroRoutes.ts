// Archivo: src/routes/libroRoutes.ts
import { Router } from 'express';
import { registrarLibro, cambiarEstadoEjemplar, editarLibro, actualizarEstadoFisico, buscarLibros, buscarLibrosAlumnos } from '../controllers/libroController';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', verificarToken, buscarLibros);
router.get('/buscar', verificarToken, buscarLibros);

router.get('/:id', verificarToken, buscarLibrosAlumnos); // Buscar libro por ID

// Crear libro (Admin y Bibliotecario)
router.post('/', verificarToken, verificarRol(['admin']), registrarLibro);

// Editar datos generales del libro (PUT /api/libros/5)
router.put('/:id', verificarToken, verificarRol(['admin']), editarLibro);

// Cambiar el estado del ejemplar físico por ID (PATCH /api/libros/ejemplar/3/estado)
router.patch('/ejemplar/:id_ejemplar/estado', verificarToken, verificarRol(['admin']), cambiarEstadoEjemplar);

// NUEVO: Actualizar el estado físico de los ejemplares buscando por ISBN
router.put('/ejemplares/actualizar-estado', verificarToken, verificarRol(['admin']), actualizarEstadoFisico);

export default router;