import express, { Application } from 'express';
import cors from 'cors';
import path from 'path'; // Se agrega para manejar las rutas de los archivos
import testRoutes from './routes/authRoutes';
import authRoutes from './routes/authRoutes';
import pruebaRoutes from './routes/pruebaRoutes';

import adminRoutes from './routes/adminRoutes';


const app: Application = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// 1. Servir archivos estáticos del Frontend
// "__dirname" apunta a la carpeta "src" (o "dist" al compilar), 
// por eso subimos un nivel con "../public"
app.use(express.static(path.join(__dirname, '../public')));

// 2. Rutas de la API REST (Backend)
// Todas las rutas del backend deben empezar con /api para no chocar con el frontend
app.use('/api', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/prueba', pruebaRoutes);
app.use('/api/admin', adminRoutes);

// 3. Fallback para el Frontend (Opcional, útil si usas un router en el cliente)
// Si alguien entra a una ruta que no es de la API, le devolvemos el index.html
// 3. Fallback para el Frontend (Middleware global)
// Esto atrapará cualquier petición que no haya coincidido con las rutas anteriores
app.use((req, res) => {
    // Si la ruta no es de la API, devolvemos el frontend
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    } else {
        // Si alguien busca una ruta de la API que no existe, mandamos un error 404
        res.status(404).json({ error: "Endpoint no encontrado" });
    }
});

export default app;