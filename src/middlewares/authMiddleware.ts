import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// guardar los datos del usuario en la petición
export interface CustomRequest extends Request {
    usuario?: any;
}

// verificar token inicado
export const verificarToken = (req: CustomRequest, res: Response, next: NextFunction): void => {
    // El token se envia en el header de la peti
    const token = req.header('Authorization')?.split(' ')[1]; 
    
    if (!token) {
        res.status(401).json({ error: 'Acceso denegado. No iniciaste sesión.' });
        return;
    }

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET as string);
        req.usuario = decodificado; // id del usuario y rol del usuario
        next(); 
    } catch (error) {
        res.status(400).json({ error: 'Token inválido o caducado.' });
    }
};

// Segundo candado: Verificar si su rol está en la lista VIP
export const verificarRol = (rolesPermitidos: string[]) => {
    return (req: CustomRequest, res: Response, next: NextFunction): void => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            res.status(403).json({ error: 'No tienes permisos de administrador para hacer esto.' });
            return;
        }
        next();
    };
};