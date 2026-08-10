import { Request, Response } from 'express';
// Importamos la conexión única global que ya tienes configurada
import prisma from '../config/db';

/**
 * Función para obtener todos los préstamos.
 * Ideal para la vista de administradores y empleados.
 */
export const obtenerPrestamos = async (req: Request, res: Response): Promise<void> => {
    try {
        // Buscamos todos los registros en la tabla Prestamo
        const prestamos = await prisma.prestamo.findMany({
            // include nos permite traer datos de tablas relacionadas automáticamente
            include: {
                // Traemos los datos del usuario que hizo el préstamo
                usuario: {
                    select: { 
                        nombre_usu: true, 
                        matricula_usu: true, 
                        estado_usu: true // Aquí incluimos tu nuevo campo
                    }
                },
                // Traemos los detalles del préstamo (qué libros se llevó)
                detalles: {
                    include: {
                        ejemplar: {
                            include: {
                                // Llegamos hasta la tabla libro para sacar el título
                                libro: { 
                                    select: { nombre_li: true, url_imagen_li: true } 
                                }
                            }
                        }
                    }
                }
            },
            // Ordenamos para ver los más recientes primero
            orderBy: {
                fecha_inicio_pre: 'desc'
            }
        });

        // Enviamos los datos al frontend en formato JSON
        res.json(prestamos);
        
    } catch (error) {
        console.error("Error al obtener préstamos:", error);
        // Si algo falla, respondemos con un error 500
        res.status(500).json({ error: 'Ocurrió un error al cargar los préstamos.' });
    }
};