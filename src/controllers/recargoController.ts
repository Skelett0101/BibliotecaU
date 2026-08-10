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

        // Si el estado es Pagado o Condonado, registramos la fecha de hoy. Si no, la dejamos en null.
        const esTerminado = estado_pago_rec.toUpperCase() === 'PAGADO' || estado_pago_rec.toUpperCase() === 'CONDONADO';

        const recargoActualizado = await prisma.recargo.update({
            where: { id_recargo: parseInt(id as string, 10) },
            data: {
                estado_pago_rec,
                fecha_pago_rec: esTerminado ? new Date() : null
            }
        });

        res.status(200).json({ mensaje: `Recargo actualizado a: ${estado_pago_rec}`, recargo: recargoActualizado });
    } catch (error) {
        console.error("Error al actualizar recargo:", error);
        res.status(500).json({ error: "Error al procesar la actualización en el servidor." });
    }
};



// ==========================================
// NUEVA FUNCIÓN PARA USUARIOS (AUTOSERVICIO)
// ==========================================
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