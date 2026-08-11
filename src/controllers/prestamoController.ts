import { Request, Response } from 'express';
import prisma from '../config/db';
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

export const autorizarPrestamo = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { id_usuario, id_ejemplar, fecha_inicio, fecha_fin, id_prestamo } = req.body;

        if (id_prestamo) {
            // Si viene de un apartado pendiente aprobado por el bibliotecario
            const prestamoActualizado = await prisma.prestamo.update({
                where: { id_prestamo: Number(id_prestamo) },
                data: {
                    estado_pre: 'ACTIVO',
                    fecha_inicio_pre: fecha_inicio ? new Date(fecha_inicio) : new Date(),
                    fecha_fin_pre: fecha_fin ? new Date(fecha_fin) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                },
                include: { usuario: true, detalles: { include: { ejemplar: { include: { libro: true } } } } }
            });
            res.status(200).json({ mensaje: 'Préstamo activado con éxito', prestamo: prestamoActualizado });
            return;
        }

        if (!id_usuario || !id_ejemplar || !fecha_inicio || !fecha_fin) {
            res.status(400).json({ error: 'Faltan datos obligatorios para autorizar el préstamo.' });
            return;
        }

        // 1. Buscar al usuario por su Matrícula (matricula_usu) o por su ID numérico
        const usuarioEncontrado = await prisma.usuario.findFirst({
            where: {
                OR: [
                    { matricula_usu: String(id_usuario) },
                    { id_usuario: !isNaN(Number(id_usuario)) ? Number(id_usuario) : undefined }
                ]
            }
        });

        if (!usuarioEncontrado) {
            res.status(404).json({ error: `No se encontró un usuario con la matrícula o ID: ${id_usuario}` });
            return;
        }

        // 2. Determinar el ejemplar físico usando el ID del ejemplar o el ISBN del libro
        let idEjemplarFinal: number | undefined = undefined;
        const inputEjemplarStr = String(id_ejemplar).trim();

        // Intentar buscar directamente como ID de ejemplar físico
        if (!isNaN(Number(inputEjemplarStr))) {
            const ejemplarPorId = await prisma.ejemplares_fisicos.findUnique({
                where: { id_ejemplar: Number(inputEjemplarStr) }
            });
            if (ejemplarPorId) {
                idEjemplarFinal = ejemplarPorId.id_ejemplar;
            }
        }

        // Si no se encontró por ID de ejemplar, buscar por el ISBN del libro (ISBN_li)
        if (!idEjemplarFinal) {
            const libroPorIsbn = await prisma.libro.findFirst({
                where: { ISBN_li: inputEjemplarStr },
                include: { ejemplares: true }
            });

            // Tomar el primer ejemplar físico disponible asociado a ese libro
            if (libroPorIsbn && libroPorIsbn.ejemplares.length > 0) {
                idEjemplarFinal = libroPorIsbn.ejemplares[0].id_ejemplar;
            }
        }

        if (!idEjemplarFinal) {
            res.status(404).json({ error: `No se encontró un ejemplar válido o disponible para: ${id_ejemplar}` });
            return;
        }

        const folio = `PRE-${Date.now()}`;

        // 3. Crear el registro del préstamo con sus detalles
        const nuevoPrestamo = await prisma.prestamo.create({
            data: {
                id_usuario: usuarioEncontrado.id_usuario,
                fecha_inicio_pre: new Date(fecha_inicio),
                fecha_fin_pre: new Date(fecha_fin),
                no_folio_pre: folio,
                estado_pre: 'Prestado',
                detalles: { create: { id_ejemplar: idEjemplarFinal } }
            },
            include: { 
                usuario: true, 
                detalles: { include: { ejemplar: { include: { libro: true } } } } 
            }
        });

        res.status(201).json({ mensaje: 'Préstamo autorizado exitosamente', prestamo: nuevoPrestamo });
    } catch (error: any) {
        console.error("Error al autorizar préstamo:", error);
        res.status(500).json({ error: error.message || 'Error al procesar la autorización del préstamo.' });
    }
};

/**
 * Función exclusiva para Admin/Bibliotecario: Modificar fechas o cambiar el estado desde el Modal
 */
export const actualizarPrestamoAdmin = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { id_prestamo } = req.params;
        const { fecha_fin, estado_pre } = req.body;

        const prestamoActualizado = await prisma.prestamo.update({
            where: { id_prestamo: Number(id_prestamo) },
            data: {
                fecha_fin_pre: fecha_fin ? new Date(fecha_fin) : undefined,
                estado_pre: estado_pre,
                // Si el estado cambia a Devuelto, registra la fecha actual automáticamente
                fecha_devolucion_real_pre: (estado_pre === 'Devuelto') ? new Date() : null
            },
            include: { usuario: true, detalles: { include: { ejemplar: true } } }
        });

        res.status(200).json({ mensaje: 'Préstamo actualizado correctamente', prestamo: prestamoActualizado });
    } catch (error: any) {
        console.error("Error al actualizar préstamo:", error);
        res.status(500).json({ error: error.message || 'Error al actualizar el préstamo.' });
    }
};


/**
 * Función para Alumnos: Solicitar apartado/préstamo desde el catálogo
 */
export const solicitarPrestamoAlumno = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const id_usuario = req.usuario?.id || req.usuario?.id_usuario;
        const { id_libro, fecha_fin } = req.body;

        if (!id_usuario) {
            res.status(401).json({ error: 'Usuario no autenticado.' });
            return;
        }

        if (!id_libro || !fecha_fin) {
            res.status(400).json({ error: 'Faltan datos obligatorios para realizar la solicitud.' });
            return;
        }

        // 1. Buscar el primer ejemplar físico disponible asociado al libro
        const ejemplarDisponible = await prisma.ejemplares_fisicos.findFirst({
            where: {
                id_libro: Number(id_libro),
                estado_fis: { not: 'Desactivado' }
            }
        });

        if (!ejemplarDisponible) {
            res.status(404).json({ error: 'No hay ejemplares disponibles para este libro en este momento.' });
            return;
        }

        const folio = `SOL-${Date.now()}`;

        // 2. Crear el registro del préstamo con estado PENDIENTE / APARTADO
        const nuevoPrestamo = await prisma.prestamo.create({
            data: {
                id_usuario: Number(id_usuario),
                fecha_inicio_pre: new Date(),
                fecha_fin_pre: new Date(fecha_fin),
                no_folio_pre: folio,
                estado_pre: 'Pendiente',
                detalles: {
                    create: { id_ejemplar: ejemplarDisponible.id_ejemplar }
                }
            },
            include: {
                detalles: { include: { ejemplar: { include: { libro: true } } } }
            }
        });

        res.status(201).json({
            mensaje: 'Solicitud de préstamo registrada con éxito.',
            prestamo: nuevoPrestamo
        });
    } catch (error: any) {
        console.error("Error al solicitar préstamo:", error);
        res.status(500).json({ error: error.message || 'Error al procesar la solicitud de préstamo.' });
    }
};