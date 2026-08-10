// Archivo: src/controllers/libroController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';

// NOTA: Esta función registra un libro y su primer ejemplar físico al mismo tiempo
export const registrarLibro = async (req: Request, res: Response): Promise<void> => {
    try {
        const { 
            id_categoria, nombre_li, editorial_li, ISBN_li, 
            ano_li, serie_li, idioma_li, url_imagen_li, 
            estado_fis, estante_libro_fis 
        } = req.body;

        // 1. Guardamos el libro usando Prisma
        const nuevoLibro = await prisma.libro.create({
            data: {
                id_categoria: parseInt(id_categoria), // Convertimos a número porque así está en la BD
                nombre_li,
                editorial_li,
                ISBN_li,
                ano_li: parseInt(ano_li),
                serie_li,
                idioma_li,
                url_imagen_li,
                // NOTA: Prisma permite crear datos relacionados en un solo paso
                ejemplares: {
                    create: [{
                        estado_fis,
                        estante_libro_fis
                    }]
                }
            },
            include: {
                ejemplares: true // Le pedimos que nos devuelva también el ejemplar creado
            }
        });

        res.status(201).json({ mensaje: "✅ Libro y ejemplar registrados con éxito", libro: nuevoLibro });
    } catch (error) {
        console.error("Error al registrar libro:", error);
        res.status(500).json({ error: "Error al guardar el libro en la base de datos" });
    }
};

// NOTA: Esta función elimina un libro por su ID
export const eliminarLibro = async (req: Request, res: Response) => {
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



//buscar libro por nombre, autor, categoria

export const buscarLibros = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = req.query;

        // Si no hay término para buscar, retornamos array vacío o todos los libros
        if (!query || typeof query !== 'string') {
            const todos = await prisma.libro.findMany({ include: { categoria: true } });
            res.status(200).json(todos);
            return;
        }

        const termino = query.trim();
        const categoriaId = parseInt(termino, 10);

        // Construimos dinámicamente las condiciones OR
        const condiciones: any[] = [
            { nombre_li: { contains: termino, mode: 'insensitive' } },
            { autor_li: { contains: termino, mode: 'insensitive' } }, // Ajusta al campo real del autor
            { editorial_li: { contains: termino, mode: 'insensitive' } },
            // Búsqueda por nombre de categoría si la relación está modelada
            { categoria: { nombre_cat: { contains: termino, mode: 'insensitive' } } } 
        ];

        // Solo agregamos la búsqueda por ID numérico si el término es un número válido
        if (!isNaN(categoriaId)) {
            condiciones.push({ id_categoria: categoriaId });
        }

        const libros = await prisma.libro.findMany({
            where: { OR: condiciones },
            include: {
                categoria: true // Incluye la relación si la necesitas en el frontend
            }
        });

        res.status(200).json(libros);
    } catch (error) {
        console.error('Error en buscarLibros:', error);
        res.status(500).json({ error: 'Error al buscar libros' });
    }
};