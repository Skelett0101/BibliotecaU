import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_por_defecto';

// REGISTRO DE USUARIO
export const registrar = async (req: Request, res: Response): Promise<void> => {
    try {
        const { matricula_usu, contra_usu, nombre_usu, rol_usu } = req.body;

        // 1. Verificar si la matrícula ya existe
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { matricula_usu }
        });

        if (usuarioExistente) {
            res.status(400).json({ error: "La matrícula ya está registrada" });
            return;
        }

        // 2. Encriptar la contraseña (hash)
        const salt = await bcrypt.genSalt(10);
        const contraHasheada = await bcrypt.hash(contra_usu, salt);

        // 3. Guardar en la base de datos
        const nuevoUsuario = await prisma.usuario.create({
            data: {
                matricula_usu,
                contra_usu: contraHasheada,
                nombre_usu,
                rol_usu: rol_usu || "alumno" // Por defecto es alumno si no envían rol
            }
        });

        res.status(201).json({ message: "Usuario registrado con éxito", id: nuevoUsuario.id_usuario });
    } catch (error) {
        console.error(">>> ERROR EXACTO EN REGISTRO:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// LOGIN DE USUARIO
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { matricula_usu, contra_usu } = req.body;

        // 1. Buscar al usuario por su matrícula
        const usuario = await prisma.usuario.findUnique({
            where: { matricula_usu }
        });

        if (!usuario) {
            res.status(404).json({ error: "Usuario no encontrado" });
            return;
        }

        if (usuario.estado_usu === 'Desactivado' || usuario.estado_usu === 'Suspendido') {
            res.status(403).json({ error: "Tu cuenta está desactivada. Contacta al administrador." });
            return;
        }


        // 2. Comparar la contraseña ingresada con la encriptada en la BD
        const contraseñaValida = await bcrypt.compare(contra_usu, usuario.contra_usu);

        if (!contraseñaValida) {
            res.status(401).json({ error: "Contraseña incorrecta" });
            return;
        }

        // 3. Generar el Token JWT
        const token = jwt.sign(
            { id: usuario.id_usuario, rol: usuario.rol_usu }, 
            JWT_SECRET, 
            { expiresIn: '1h' } // El token caduca en 1 hora
        );

        res.status(200).json({ 
            message: "Login exitoso", 
            token, 
            usuario: { nombre: usuario.nombre_usu, rol: usuario.rol_usu } 
        });
    } catch (error) {
        console.error("DETALLE DEL ERROR:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};