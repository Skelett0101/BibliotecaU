// Archivo: src/controllers/libroController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';

export const registrarLibro = async (req: Request, res: Response): Promise<void> => {
    try {
        const { 
            id_categoria, nombre_li, editorial_li, ISBN_li, 
            ano_li, serie_li, idioma_li, url_imagen_li, 
            ejemplares, estado_fis, estante_libro_fis,
            autores 
        } = req.body;

        if (ISBN_li) {
            const existeLibro = await prisma.libro.findFirst({
                where: { ISBN_li: ISBN_li }
            });
            
            if (existeLibro) {
                res.status(400).json({ error: `No se puede registrar. Ya existe un libro con el ISBN: ${ISBN_li}` });
                return; 
            }
        }

        // 1. Guardamos el libro
        console.log("--- INICIANDO REGISTRO DE LIBRO ---");
        const nuevoLibro = await prisma.libro.create({
            data: {
                id_categoria: parseInt(id_categoria), 
                nombre_li, editorial_li, ISBN_li,
                ano_li: ano_li ? parseInt(ano_li) : null,
                serie_li, idioma_li, url_imagen_li,
                ejemplares: {
                    create: ejemplares && ejemplares.length > 0 ? ejemplares.map((e: any) => ({
                        estado_fis: e.estado_fis || "Excelente",
                        estante_libro_fis: e.estante_libro_fis || null
                    })) : [{
                        estado_fis: estado_fis || "Excelente",
                        estante_libro_fis: estante_libro_fis || null
                    }]
                }
            },
            include: { ejemplares: true }
        });
        console.log(`✅ Libro guardado exitosamente con ID: ${nuevoLibro.id_libro}`);

        // 2. Lógica para Autores
        if (autores && autores.length > 0) {
            console.log(`📚 Procesando ${autores.length} autor(es)...`);
            
            for (const autor of autores) {
                let autorExistente = await prisma.autor_libro.findFirst({
                    where: { 
                        nombre_au: autor.nombre_au, 
                        apellido_au: autor.apellido_au 
                    }
                });

                if (!autorExistente) {
                    autorExistente = await prisma.autor_libro.create({
                        data: {
                            nombre_au: autor.nombre_au,
                            apellido_au: autor.apellido_au
                        }
                    });
                    console.log(`👤 NUEVO autor registrado: ${autorExistente.nombre_au} ${autorExistente.apellido_au} (ID: ${autorExistente.id_autor})`);
                } else {
                    console.log(`🔍 Autor ya existía, reutilizando: ${autorExistente.nombre_au} ${autorExistente.apellido_au} (ID: ${autorExistente.id_autor})`);
                }

                await prisma.libro_Autor.create({
                    data: {
                        id_libro: nuevoLibro.id_libro,
                        id_autor: autorExistente.id_autor
                    }
                });
                console.log(`🔗 Relación creada: Libro [${nuevoLibro.id_libro}] <---> Autor [${autorExistente.id_autor}]`);
            }
        }

        console.log("--- FIN DEL REGISTRO EXITOSO ---");
        res.status(201).json({ mensaje: "✅ Libro, ejemplares y autores registrados con éxito", libro: nuevoLibro });
    } catch (error) {
        console.error("❌ Error CRÍTICO al registrar libro:", error);
        res.status(500).json({ error: "Error al guardar el libro en la base de datos" });
    }
};

export const eliminarLibro = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; 
        
        await prisma.libro.delete({
            where: { id_libro: parseInt(id as string) }
        });
        
        res.status(200).json({ mensaje: "🗑️ Libro eliminado correctamente del inventario" });
    } catch (error) {
        console.error("Error al eliminar libro:", error);
        res.status(500).json({ error: "Error al intentar eliminar el libro" });
    }
};

export const buscarLibros = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = req.query;

        if (!query || typeof query !== 'string') {
            const todos = await prisma.libro.findMany({ 
                include: { categoria: true, ejemplares: true } 
            });
            res.status(200).json(todos);
            return;
        }

        const termino = query.trim();
        const categoriaId = parseInt(termino, 10);

        const condiciones: any[] = [
            { nombre_li: { contains: termino } },
            { editorial_li: { contains: termino } },
            { ISBN_li: { contains: termino } },
            { categoria: { nombre_cat: { contains: termino } } } 
        ];

        if (!isNaN(categoriaId)) {
            condiciones.push({ id_categoria: categoriaId });
        }

        const libros = await prisma.libro.findMany({
            where: { OR: condiciones },
            include: {
                categoria: true,
                ejemplares: true
            }
        });

        res.status(200).json(libros);
    } catch (error) {
        console.error('Error en buscarLibros:', error);
        res.status(500).json({ error: 'Error al buscar libros' });
    }
};

export const cambiarEstadoEjemplar = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id_ejemplar } = req.params;
        const { nuevo_estado } = req.body;

        const ejemplarActualizado = await prisma.ejemplares_fisicos.update({
            where: { id_ejemplar: parseInt(id_ejemplar as string) },
            data: { estado_fis: nuevo_estado || "Desactivado" }
        });

        res.status(200).json({ 
            mensaje: `🔄 ¡Éxito! El estado del ejemplar cambió a '${ejemplarActualizado.estado_fis}'`, 
            ejemplar: ejemplarActualizado 
        });
    } catch (error) {
        console.error("Error al cambiar estado:", error);
        res.status(500).json({ error: "Error al cambiar el estado del ejemplar" });
    }
};

export const editarLibro = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ mensaje: "Operación en mantenimiento" });
};

export const actualizarEstadoFisico = async (req: Request, res: Response): Promise<void> => {
    const { ISBN_li, estado_fis, estante_libro_fis } = req.body;

    try {
        if (!ISBN_li) {
            res.status(400).json({ error: "El ISBN es obligatorio para buscar el libro." });
            return;
        }

        const isbnLimpio = ISBN_li.trim();

        const libroEncontrado = await prisma.libro.findFirst({
            where: { ISBN_li: isbnLimpio }
        });

        if (!libroEncontrado) {
            res.status(404).json({ error: `No existe ningún libro con el ISBN: ${isbnLimpio}` });
            return;
        }

        const estanteFinal = (estante_libro_fis && estante_libro_fis.trim() !== "") ? estante_libro_fis.trim() : null;

        const ejemplaresExistentes = await prisma.ejemplares_fisicos.findMany({
            where: { id_libro: libroEncontrado.id_libro }
        });

        if (ejemplaresExistentes.length > 0) {
            await prisma.ejemplares_fisicos.updateMany({
                where: { id_libro: libroEncontrado.id_libro },
                data: { 
                    estado_fis: estado_fis || "Excelente",
                    estante_libro_fis: estanteFinal
                }
            });
        } else {
            await prisma.ejemplares_fisicos.create({
                data: {
                    id_libro: libroEncontrado.id_libro,
                    estado_fis: estado_fis || "Excelente",
                    estante_libro_fis: estanteFinal
                }
            });
        }

        res.status(200).json({ 
            mensaje: `✅ ¡Éxito! El estado físico y la ubicación del libro "${libroEncontrado.nombre_li}" se actualizaron.`,
            id_libro_afectado: libroEncontrado.id_libro
        });
    } catch (error) {
        console.error("Error al actualizar estado físico:", error);
        res.status(500).json({ error: "Error interno del servidor al actualizar estado." });
    }
};