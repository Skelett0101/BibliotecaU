// Archivo: src/controllers/libroController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';

//- ----------------------------------------------------------------------------
export const registrarLibro = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            id_categoria, nombre_li, editorial_li, ISBN_li,
            ano_li, serie_li, idioma_li, url_imagen_li,
            ejemplares, estado_fis, estante_libro_fis,
            autores
        } = req.body;

        // NUEVO: Validación obligatoria de la portada
        if (!url_imagen_li) {
            res.status(400).json({ error: "La URL de la portada (url_imagen_li) es obligatoria." });
            return;
        }

        if (ISBN_li) {
            const existeLibro = await prisma.libro.findFirst({
                where: { ISBN_li: ISBN_li }
            });
            if (existeLibro) {
                res.status(400).json({ error: `Ya existe un libro con el ISBN: ${ISBN_li}` });
                return;
            }
        }

        // Registro sin console.logs
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

        if (autores && autores.length > 0) {
            for (const autor of autores) {
                let autorExistente = await prisma.autor_libro.findFirst({
                    where: { nombre_au: autor.nombre_au, apellido_au: autor.apellido_au }
                });

                if (!autorExistente) {
                    autorExistente = await prisma.autor_libro.create({
                        data: { nombre_au: autor.nombre_au, apellido_au: autor.apellido_au }
                    });
                }

                await prisma.libro_Autor.create({
                    data: { id_libro: nuevoLibro.id_libro, id_autor: autorExistente.id_autor }
                });
            }
        }

        res.status(201).json({ mensaje: "✅ Libro registrado con éxito", libro: nuevoLibro });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar el libro en la base de datos" });
    }
};

// ===============================================
// NUEVA FUNCIÓN PARA EDITAR CATEGORÍA
// ===============================================
export const editarCategoria = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { nombre_cat } = req.body;
        
        if (!nombre_cat) {
            res.status(400).json({ error: "El nombre de la categoría no puede estar vacío." });
            return;
        }

        const categoriaActualizada = await prisma.categoria.update({
            where: { id_categoria: parseInt(id as string) },
            data: { nombre_cat }
        });

        res.status(200).json({ mensaje: "✅ Categoría actualizada exitosamente", categoria: categoriaActualizada });
    } catch (error) {
        res.status(500).json({ error: "Error interno al actualizar la categoría" });
    }
};
// -------------------------------------------------------------------------------
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
// -----------------------------------------------------------------------------
//Buscar libros Alumnos
export const buscarLibrosAlumnos = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = req.query;

        // Incluimos autores, categorías y ejemplares en todas las consultas
        const relacionesInclude = {
            categoria: true,
            ejemplares: true,
            autores: {
                include: {
                    autor: true // Trae nombre_au y apellido_au desde autor_libro
                }
            }
        };

        if (!query || typeof query !== 'string') {
            const todos = await prisma.libro.findMany({
                include: relacionesInclude
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
            { categoria: { nombre_cat: { contains: termino } } },
            // Permite buscar también por el nombre del autor
            {
                autores: {
                    some: {
                        autor: {
                            OR: [
                                { nombre_au: { contains: termino } },
                                { apellido_au: { contains: termino } }
                            ]
                        }
                    }
                }
            }
        ];

        if (!isNaN(categoriaId)) {
            condiciones.push({ id_categoria: categoriaId });
        }

        const libros = await prisma.libro.findMany({
            where: { OR: condiciones },
            include: relacionesInclude
        });

        res.status(200).json(libros);
    } catch (error) {
        console.error('Error en buscarLibros:', error);
        res.status(500).json({ error: 'Error al buscar libros' });
    }
};

//--------------------------------------------------------------
// Buscar libros administrador
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
// ------------------------------------------------------

// ----------------------------------------------------------------------------------

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



////----------------------------------------------------------
export const editarLibro = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { 
            id_categoria, nombre_li, editorial_li, ISBN_li, 
            ano_li, serie_li, idioma_li, url_imagen_li 
        } = req.body;

        const libroActualizado = await prisma.libro.update({
            where: { id_libro: parseInt(id as string) },
            data: {
                id_categoria: parseInt(id_categoria),
                nombre_li, 
                editorial_li, 
                ISBN_li,
                ano_li: ano_li ? parseInt(ano_li) : null,
                serie_li, 
                idioma_li, 
                url_imagen_li
            }
        });

        res.status(200).json({ 
            mensaje: "✅ Información principal del libro actualizada con éxito.", 
            libro: libroActualizado 
        });
    } catch (error) {
        console.error("Error al editar libro:", error);
        res.status(500).json({ error: "Error interno al actualizar los datos del libro." });
    }
};




//-------------------------------------------------------------
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

// ==========================================
// NUEVAS FUNCIONES: CATEGORÍAS Y AUTORES
// ==========================================

export const obtenerCategorias = async (req: Request, res: Response): Promise<void> => {
    try {
        const categorias = await prisma.categoria.findMany({
            orderBy: { nombre_cat: 'asc' }
        });
        res.status(200).json(categorias);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar categorías" });
    }
};

export const crearCategoria = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre_cat } = req.body;
        if (!nombre_cat) {
            res.status(400).json({ error: "El nombre es obligatorio" });
            return;
        }
        const nuevaCategoria = await prisma.categoria.create({
            data: { nombre_cat }
        });
        res.status(201).json({ mensaje: "✅ Categoría agregada", categoria: nuevaCategoria });
    } catch (error) {
        res.status(500).json({ error: "Error al crear la categoría" });
    }
};

export const obtenerAutores = async (req: Request, res: Response): Promise<void> => {
    try {
        const autores = await prisma.autor_libro.findMany({
            orderBy: { nombre_au: 'asc' }
        });
        res.status(200).json(autores);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar autores" });
    }
};

// NUEVA FUNCIÓN: Agregar autor independiente a la BD
export const crearAutor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre_au, apellido_au } = req.body;
        
        if (!nombre_au || !apellido_au) {
            res.status(400).json({ error: "Nombre y apellido son obligatorios" });
            return;
        }

        // Evitar duplicados exactos en la base de datos
        const existe = await prisma.autor_libro.findFirst({
            where: { nombre_au: nombre_au, apellido_au: apellido_au }
        });

        if (existe) {
            res.status(400).json({ error: "Este autor ya está registrado en la base de datos." });
            return;
        }

        const nuevoAutor = await prisma.autor_libro.create({
            data: { nombre_au, apellido_au }
        });

        res.status(201).json({ mensaje: "✅ Autor registrado exitosamente en la BD", autor: nuevoAutor });
    } catch (error) {
        console.error("Error al crear autor:", error);
        res.status(500).json({ error: "Error al registrar el autor" });
    }
};