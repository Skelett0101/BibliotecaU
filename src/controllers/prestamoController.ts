import { Request, Response } from 'express';
import prisma from '../config/db';
// Asegúrate de importar esta interfaz desde tus middlewares
import { CustomRequest } from '../middlewares/authMiddleware';

/**
 * Función para obtener todos los préstamos (Admin/Empleado)
 */
export const obtenerPrestamos = async (req: Request, res: Response): Promise<void> => {
    try {
        const prestamos = await prisma.prestamo.findMany({
            include: {
                usuario: { select: { nombre_usu: true, matricula_usu: true, estado_usu: true } },
                detalles: { include: { ejemplar: { include: { libro: { select: { nombre_li: true, url_imagen_li: true } } } } } }
            },
            orderBy: { fecha_inicio_pre: 'desc' }
        });
        res.json(prestamos);
    } catch (error) {
        res.status(500).json({ error: 'Ocurrió un error al cargar los préstamos.' });
    }
};

// ==========================================
// NUEVAS FUNCIONES DE USUARIO
// ==========================================

export const visualizarMisPrestamos = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const id_usuario = req.usuario?.id || req.usuario?.id_usuario;
        const misPrestamos = await prisma.prestamo.findMany({
            where: { id_usuario: Number(id_usuario) },
            include: { detalles: { include: { ejemplar: { include: { libro: true } } } } },
            orderBy: { fecha_inicio_pre: 'desc' }
        });
        res.status(200).json(misPrestamos);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar tus préstamos' });
    }
};

export const solicitarPrestamo = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const id_usuario = req.usuario?.id || req.usuario?.id_usuario;
        const { id_ejemplar } = req.body;

        const fecha_inicio = new Date();
        const fecha_fin = new Date();
        fecha_fin.setDate(fecha_inicio.getDate() + 5);

        const folio = `PRE-${Date.now()}`;

        const nuevaSolicitud = await prisma.prestamo.create({
            data: {
                id_usuario: Number(id_usuario),
                fecha_inicio_pre: fecha_inicio,
                fecha_fin_pre: fecha_fin,
                no_folio_pre: folio,
                estado_pre: 'PENDIENTE',
                detalles: { create: { id_ejemplar: Number(id_ejemplar) } }
            }
        });

        res.status(201).json({ mensaje: 'Préstamo solicitado', prestamo: nuevaSolicitud });
    } catch (error) {
        res.status(500).json({ error: 'Error al solicitar el préstamo' });
    }
};

export const renovarMiPrestamo = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const id_usuario = req.usuario?.id || req.usuario?.id_usuario;
        const { id_prestamo } = req.params;

        const prestamo = await prisma.prestamo.findFirst({
            where: { id_prestamo: Number(id_prestamo), id_usuario: Number(id_usuario) }
        });

        if (!prestamo) {
            res.status(404).json({ error: 'Préstamo no encontrado o no te pertenece' });
            return;
        }

        const nuevaFechaFin = new Date(prestamo.fecha_fin_pre);
        nuevaFechaFin.setDate(nuevaFechaFin.getDate() + 5);

        const prestamoRenovado = await prisma.prestamo.update({
            where: { id_prestamo: Number(id_prestamo) },
            data: { fecha_fin_pre: nuevaFechaFin, estado_pre: 'RENOVADO' }
        });

        res.status(200).json({ mensaje: 'Préstamo renovado exitosamente', prestamo: prestamoRenovado });
    } catch (error) {
        res.status(500).json({ error: 'Error al renovar el préstamo' });
    }
};