import { Request, Response } from 'express';
import prisma from '../config/db';

// (La función de inventario que ya tenías se mantiene aquí)
export const obtenerReporteInventario = async (req: Request, res: Response): Promise<void> => {
    try {
        const inventarioLibros = await prisma.libro.findMany({
            include: {
                categoria: { select: { nombre_cat: true } },
                _count: { select: { ejemplares: true } }
            }
        });
        const resumenEstados = await prisma.ejemplares_fisicos.groupBy({
            by: ['estado_fis'],
            _count: { estado_fis: true }
        });
        res.json({ libros: inventarioLibros, resumenEstados });
    } catch (error) {
        res.status(500).json({ error: 'Ocurrió un error al cargar el inventario.' });
    }
};

/**
 * 1. Exclusivo Admin: Usuarios con más atrasos / moras
 */
export const obtenerReporteAtrasos = async (req: Request, res: Response): Promise<void> => {
    try {
        const usuariosAtrasos = await prisma.usuario.findMany({
            where: {
                prestamos: {
                    some: {
                        OR: [
                            { estado_pre: 'MORA' },
                            { estado_pre: 'ATRASADO' },
                            { recargos: { some: { estado_pago_rec: 'PENDIENTE' } } }
                        ]
                    }
                }
            },
            include: {
                prestamos: {
                    include: { recargos: true }
                }
            }
        });
        res.status(200).json(usuariosAtrasos);
    } catch (error) {
        res.status(500).json({ error: 'Error al generar el reporte de atrasos.' });
    }
};

/**
 * 2. Exclusivo Admin: Libros totales en el sistema
 */
export const obtenerReporteLibrosTotales = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalLibros = await prisma.libro.count();
        const totalEjemplaresFisicos = await prisma.ejemplares_fisicos.count();
        const librosPorCategoria = await prisma.categoria.findMany({
            include: {
                _count: { select: { libros: true } }
            }
        });

        res.status(200).json({
            totalLibros,
            totalEjemplaresFisicos,
            librosPorCategoria
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el total de libros.' });
    }
};

/**
 * 3. Exclusivo Admin: Ingresos por recargos
 */
export const obtenerReporteIngresos = async (req: Request, res: Response): Promise<void> => {
    try {
        const recargos = await prisma.recargo.findMany({
            include: {
                prestamo: {
                    include: { usuario: { select: { nombre_usu: true, matricula_usu: true } } }
                }
            }
        });

        // Calcular la suma total de ingresos por recargos pagados o pendientes
        const totalIngresos = recargos.reduce((acc, curr) => acc + Number(curr.monto_rec), 0);

        res.status(200).json({
            totalIngresos,
            detalleRecargos: recargos
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al calcular los ingresos por recargos.' });
    }
};