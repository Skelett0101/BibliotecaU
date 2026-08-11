import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { CustomRequest } from '../middlewares/authMiddleware';


// Obtener lista de usuarios para la tabla
export const obtenerUsuarios = async (req: Request, res: Response): Promise<void> => {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id_usuario: true,
                matricula_usu: true,
                nombre_usu: true,
                rol_usu: true,
                estado_usu: true
            },
            orderBy: { id_usuario: 'desc' }
        });

        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: "Error al obtener la lista de usuarios" });
    }
};



// Registrar usuario desde el panel
export const registrarUsuario = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { matricula_usu, contra_usu, nombre_usu, rol_usu } = req.body;
        const miRol = req.usuario?.rol || req.usuario?.rol_usu; 

        if (!matricula_usu || !contra_usu || !nombre_usu || !rol_usu) {
            res.status(400).json({ error: "Todos los campos son obligatorios" });
            return;
        }

        
        if (miRol === 'bibliotecario' && rol_usu === 'admin') {
            res.status(403).json({ error: "Permiso denegado. No puedes crear usuarios con rol de Administrador." });
            return;
        }

        const usuarioExistente = await prisma.usuario.findUnique({ where: { matricula_usu } });
        if (usuarioExistente) {
            res.status(400).json({ error: "La matrícula ya está registrada en el sistema" });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const contraHasheada = await bcrypt.hash(contra_usu, salt);

        const nuevoUsuario = await prisma.usuario.create({
            data: { matricula_usu, contra_usu: contraHasheada, nombre_usu, rol_usu }
        });

        res.status(201).json({ mensaje: `¡Éxito! Usuario ${nuevoUsuario.nombre_usu} creado con el rol de [${nuevoUsuario.rol_usu.toUpperCase()}]` });

    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
};



// Actualizar un usuario existente
export const actualizarUsuario = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const miRol = req.usuario?.rol || req.usuario?.rol_usu;

        // 🛡️ REGLA DE NEGOCIO: El bibliotecario no tiene acceso a la edición
        if (miRol === 'bibliotecario') {
            res.status(403).json({ error: "Permiso denegado. Solo los administradores pueden editar usuarios." });
            return;
        }

        const { id } = req.params; 
        const { matricula_usu, nombre_usu, rol_usu, estado_usu } = req.body;

        if (!matricula_usu || !nombre_usu || !rol_usu || !estado_usu) {
            res.status(400).json({ error: "Faltan datos obligatorios para actualizar." });
            return;
        }

        const idNumero = parseInt(id as string, 10);
        const usuarioExistente = await prisma.usuario.findUnique({ where: { matricula_usu } });

        if (usuarioExistente && usuarioExistente.id_usuario !== idNumero) {
            res.status(400).json({ error: "Esta matrícula ya está en uso por otro usuario." });
            return;
        }

        await prisma.usuario.update({
            where: { id_usuario: idNumero },
            data: { matricula_usu, nombre_usu, rol_usu, estado_usu }
        });

        res.status(200).json({ mensaje: "Datos del usuario actualizados correctamente." });

    } catch (error) {
        res.status(500).json({ error: "Error al actualizar en el servidor." });
    }
};