import { Router, Request, Response } from 'express';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware';

const router = Router();

// Puerta 1: Nivel Básico (Solo requiere Token) -> Entran Todos
router.get('/catalogo', verificarToken, (req: Request, res: Response) => {
    res.json({ mensaje: "✅ ¡Éxito! Estás viendo los libros del catálogo." });
});

// Puerta 2: Nivel Medio -> Solo Bibliotecario y Becario
router.get('/prestar', verificarToken, verificarRol(['bibliotecario', 'becario']), (req: Request, res: Response) => {
    res.json({ mensaje: "✅ ¡Éxito! Tienes permiso para prestar libros." });
});

// Puerta 3: Nivel Alto -> Solo Bibliotecario
router.get('/recargos', verificarToken, verificarRol(['bibliotecario']), (req: Request, res: Response) => {
    res.json({ mensaje: "✅ ¡Éxito! Tienes permiso de jefe para borrar recargos." });
});

export default router;