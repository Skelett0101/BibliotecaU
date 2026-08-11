import { Request, Response } from 'express';
import prisma from '../config/db';
import { CustomRequest } from '../middlewares/authMiddleware';


// Obtener todos los recargos
export const obtenerRecargos = async (req: Request, res: Response): Promise<void> => {
    try {
        const recargos = await prisma.recargo.findMany({
            include: {
                prestamo: {
                    include: {
                        usuario: { select: { nombre_usu: true, matricula_usu: true } }
                    }
                }
            },
            orderBy: { id_recargo: 'desc' }
        });
        res.status(200).json(recargos);
    } catch (error) {
        console.error("Error al obtener recargos:", error);
        res.status(500).json({ error: "Error al cargar la lista de recargos." });
    }
};

// Pagar un recargo
// Actualizar el estado de un recargo
export const actualizarRecargo = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { estado_pago_rec } = req.body;

        if (!estado_pago_rec) {
            res.status(400).json({ error: "El estado del recargo es obligatorio." });
            return;
        }

        const estadoUpper = estado_pago_rec.toUpperCase();
        // Si el estado es Pagado o Condonado, registramos la fecha de hoy.
        const esTerminado = estadoUpper === 'PAGADO' || estadoUpper === 'CONDONADO';

       
        const recargoActual = await prisma.recargo.findUnique({
            where: { id_recargo: parseInt(id as string, 10) }
        });

        if (!recargoActual) {
            res.status(404).json({ error: "Recargo no encontrado." });
            return;
        }

        
        const recargoActualizado = await prisma.recargo.update({
            where: { id_recargo: parseInt(id as string, 10) },
            data: {
                estado_pago_rec,
                fecha_pago_rec: esTerminado ? new Date() : null
            }
        });

        
        if (esTerminado) {
            await prisma.prestamo.update({
                where: { id_prestamo: recargoActual.id_prestamo },
                data: {
                    estado_pre: 'Devuelto', 
                    fecha_devolucion_real_pre: new Date() 
                }
            });
        }

        res.status(200).json({ mensaje: `Recargo actualizado a: ${estado_pago_rec}`, recargo: recargoActualizado });
    } catch (error) {
        console.error("Error al actualizar recargo y préstamo:", error);
        res.status(500).json({ error: "Error al procesar la actualización en el servidor." });
    }
};



export const obtenerMisRecargos = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const id_usuario = req.usuario?.id || req.usuario?.id_usuario;
        
        const misRecargos = await prisma.recargo.findMany({
            where: {
                prestamo: {
                    id_usuario: Number(id_usuario)
                }
            },
            include: {
                prestamo: {
                    include: {
                        detalles: { include: { ejemplar: { include: { libro: true } } } }
                    }
                }
            },
            orderBy: { id_recargo: 'desc' }
        });
        
        res.status(200).json(misRecargos);
    } catch (error) {
        console.error("Error al cargar mis recargos:", error);
        res.status(500).json({ error: "Error al cargar tu historial de multas." });
    }
};




// RECARGOS
export const sincronizarRecargos = async (req: Request, res: Response): Promise<void> => {
    try {
        const hoy = new Date();
        const COSTO_POR_DIA = 50.00; // Costo dia

        const prestamosVencidos = await prisma.prestamo.findMany({
            where: {
                fecha_fin_pre: { lt: hoy },
                estado_pre: { in: ['Prestado', 'Incidencia'] } 
            }
        });

        if (prestamosVencidos.length === 0) {
            res.status(200).json({ mensaje: "Todo al día. No hay nuevos préstamos vencidos." });
            return;
        }

        for (const prestamo of prestamosVencidos) {
            const diferenciaMilisegundos = hoy.getTime() - prestamo.fecha_fin_pre.getTime();
            const diasRetraso = Math.max(1, Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24)));
            const montoCalculado = diasRetraso * COSTO_POR_DIA;

            if (prestamo.estado_pre === 'Prestado') {
                await prisma.prestamo.update({
                    where: { id_prestamo: prestamo.id_prestamo },
                    data: { estado_pre: 'Incidencia' }
                });
            }

            const recargoExistente = await prisma.recargo.findFirst({
                where: { 
                    id_prestamo: prestamo.id_prestamo,
                    estado_pago_rec: { notIn: ['Pagado', 'Condonado'] } 
                }
            });

            if (recargoExistente) {
                await prisma.recargo.update({
                    where: { id_recargo: recargoExistente.id_recargo },
                    data: {
                        dias_retraso_rec: diasRetraso,
                        monto_rec: montoCalculado,
                        estado_pago_rec: diasRetraso > 15 ? 'Mora Grave' : 'Pendiente'
                    }
                });
            } else {
                await prisma.recargo.create({
                    data: {
                        id_prestamo: prestamo.id_prestamo,
                        monto_rec: montoCalculado,
                        dias_retraso_rec: diasRetraso,
                        estado_pago_rec: 'Pendiente'
                    }
                });
            }
        }

        res.status(200).json({ mensaje: `¡Sincronización exitosa! Se actualizaron ${prestamosVencidos.length} recargos.` });

    } catch (error) {
        console.error("Error en sincronización manual:", error);
        res.status(500).json({ error: "Error al sincronizar los recargos." });
    }
};