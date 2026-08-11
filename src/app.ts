import express, { Application } from 'express';
import cors from 'cors';
import path from 'path'; 
import testRoutes from './routes/authRoutes';
import authRoutes from './routes/authRoutes';
import prestamoRoutes from './routes/prestamoRoutes'; 
import reporteRoutes from './routes/reporteRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import libroRoutes from './routes/libroRoutes';
import recargoRoutes from './routes/recargoRoutes';


const app: Application = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

//  archivos estáticos del Frontend
app.use(express.static(path.join(__dirname, '../public')));


// proteccion de cache 
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});


// Rutas de la API REST 
app.use('/api', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/prestamos', prestamoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/libros', libroRoutes);
app.use('/api/recargos', recargoRoutes);


// Esto atrapa cualquier petición que no haya coincidido con las rutas anteriores
app.use((req, res) => {
    // Si la ruta no es de la API devolvemos el frontend
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../public/login.html'));
    } else {
        // Si alguien busca una ruta de la API que no existe error 404
        res.status(404).json({ error: "Endpoint no encontrado" });
    }
});

export default app;