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

/**
 * Nueva función: Resumen para el Panel (Dashboard)
 */
export const obtenerResumenDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

        const [
            totalLibros, 
            prestamosActivos, 
            totalUsuarios, 
            totalRecargos,
            prestamosEsteMes,
            usuariosActivos,
            prestamosEnMora,
            actividad,
            categorias,
            totalEjemplaresFisicos // <-- NUEVO: Contamos total de ejemplares físicos
        ] = await Promise.all([
            prisma.libro.count(),
            prisma.prestamo.count({ where: { estado_pre: 'Prestado' } }),
            prisma.usuario.count(),
            prisma.recargo.aggregate({ _sum: { monto_rec: true } }),
            prisma.prestamo.count({ where: { fecha_inicio_pre: { gte: inicioMes } } }),
            prisma.usuario.count({ where: { estado_usu: 'activo' } }),
            prisma.prestamo.count({ where: { OR: [{ estado_pre: 'MORA' }, { estado_pre: 'ATRASADO' }] } }),
            prisma.prestamo.findMany({
                take: 5,
                orderBy: { fecha_inicio_pre: 'desc' },
                include: { usuario: { select: { nombre_usu: true } } }
            }),
            prisma.categoria.findMany({
                include: {
                    libros: {
                        include: {
                            ejemplares: {
                                include: { detallesPrestamo: true }
                            }
                        }
                    }
                }
            }),
            prisma.ejemplares_fisicos.count() // <-- NUEVO
        ]);

        // Calcular porcentaje de capacidad ocupada (Evitando división por cero)
        const capacidadPorcentaje = totalEjemplaresFisicos > 0 
            ? Math.round((prestamosActivos / totalEjemplaresFisicos) * 100) 
            : 0;

        // Procesar categorías para la gráfica (lo que ya tenías)
        const prestamosPorCategoria = categorias.map(cat => {
            let totalPrestamos = 0;
            cat.libros.forEach(libro => {
                libro.ejemplares.forEach(ejemplar => {
                    totalPrestamos += ejemplar.detallesPrestamo.length;
                });
            });
            return { nombre: cat.nombre_cat, total: totalPrestamos };
        });

        res.status(200).json({
            totalLibros,
            prestamosActivos,
            totalUsuarios,
            totalIngresos: totalRecargos._sum.monto_rec || 0,
            prestamosEsteMes,
            usuariosActivos,
            prestamosEnMora,
            actividad,
            prestamosPorCategoria,
            capacidadPorcentaje // <-- NUEVO: Lo mandamos al frontend
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar los datos del dashboard.' });
    }
};

export const obtenerDatosReportePDF = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Libros prestados activos con detalles
        const librosPrestados = await prisma.prestamo.findMany({
            where: { estado_pre: 'Prestado' },
            include: {
                usuario: { select: { nombre_usu: true, matricula_usu: true } },
                detalles: {
                    include: {
                        ejemplar: {
                            include: { libro: { select: { nombre_li: true } } }
                        }
                    }
                }
            }
        });

        // 2. Usuarios con más atrasos / moras
        const usuariosAtrasos = await prisma.usuario.findMany({
            where: {
                prestamos: {
                    some: {
                        OR: [
                            { estado_pre: 'MORA' },
                            { estado_pre: 'ATRASADO' }
                        ]
                    }
                }
            },
            include: {
                prestamos: {
                    where: {
                        OR: [
                            { estado_pre: 'MORA' },
                            { estado_pre: 'ATRASADO' }
                        ]
                    },
                    include: { recargos: true }
                }
            }
        });

        // 3. Libros totales en el sistema
        const totalLibros = await prisma.libro.count();
        const totalEjemplares = await prisma.ejemplares_fisicos.count();

        // 4. Ingresos totales por recargos
        const recargos = await prisma.recargo.aggregate({
            _sum: { monto_rec: true }
        });

        res.status(200).json({
            librosPrestados,
            usuariosAtrasos,
            totalLibros,
            totalEjemplares,
            totalIngresos: recargos._sum.monto_rec || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al recopilar la información para el reporte PDF.' });
    }
};