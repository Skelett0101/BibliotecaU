import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// Instanciamos Prisma para conectarnos a la base de datos
const prisma = new PrismaClient();

/**
 * Función para obtener el reporte general de inventario.
 * Exclusivo para administradores.
 */
export const obtenerReporteInventario = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Obtenemos todos los libros y contamos cuántos ejemplares físicos tiene cada uno
        const inventarioLibros = await prisma.libro.findMany({
            include: {
                // Traemos el nombre de la categoría del libro
                categoria: { 
                    select: { nombre_cat: true } 
                },
                // Prisma cuenta automáticamente cuántos registros hay en la tabla relacionada
                _count: {
                    select: { ejemplares: true } 
                }
            }
        });

        // 2. Agrupamos los ejemplares por su estado físico (ej. "Bueno", "Dañado")
        const resumenEstados = await prisma.ejemplares_fisicos.groupBy({
            by: ['estado_fis'],
            _count: {
                estado_fis: true
            }
        });

        // 3. Enviamos un objeto JSON con ambos resultados al frontend
        res.json({
            libros: inventarioLibros,
            resumenEstados: resumenEstados
        });
        
    } catch (error) {
        console.error("Error al generar el reporte de inventario:", error);
        res.status(500).json({ error: 'Ocurrió un error al cargar el inventario.' });
    }
};