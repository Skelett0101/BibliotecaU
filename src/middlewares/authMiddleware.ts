import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos Express temporalmente para poder guardar los datos del usuario en la petición
export interface CustomRequest extends Request {
    usuario?: any;
}

// 1. Primer candado: Verificar que el usuario sí haya iniciado sesión (que tenga un token válido)
export const verificarToken = (req: CustomRequest, res: Response, next: NextFunction): void => {
    // El token suele enviarse en los headers como "Bearer eyJhbGci..."
    const token = req.header('Authorization')?.split(' ')[1]; 
    
    if (!token) {
        res.status(401).json({ error: 'Acceso denegado. No iniciaste sesión.' });
        return;
    }

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET as string);
        req.usuario = decodificado; // Aquí Prisma guardó el "id" y el "rol" cuando hicimos el login
        next(); // Todo chido, déjalo pasar a la siguiente validación
    } catch (error) {
        res.status(400).json({ error: 'Token inválido o caducado.' });
    }
};

// 2. Segundo candado: Verificar si su rol está en la lista VIP
export const verificarRol = (rolesPermitidos: string[]) => {
    return (req: CustomRequest, res: Response, next: NextFunction): void => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            res.status(403).json({ error: 'No tienes permisos de administrador para hacer esto.' });
            return;
        }
        next(); // Tiene el rol correcto, déjalo pasar al controlador
    };
};