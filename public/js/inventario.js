// Archivo: public/js/inventario.js

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // PARTE 1: LÓGICA DE REPORTES (TU CÓDIGO)
    // ==========================================
    const rolActual = Auth.getRol();
    
    // Verificamos el rol para cargar el reporte solo si es administrador
    if (rolActual === 'admin') {
        cargarReporteInventario();
    } else {
        console.log("El reporte de inventario es exclusivo para administradores.");
    }

    // ==========================================
    // PARTE 2: LÓGICA DE GUARDAR (CÓDIGO DE TU COLABORADOR)
    // ==========================================
    const btnGuardar = document.getElementById('btn-guardar');

    // Validamos que el botón exista en el HTML para evitar errores en la consola
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            // Recolectamos los datos de los inputs
            const datosLibro = {
                id_categoria: document.getElementById('id_categoria').value,
                nombre_li: document.getElementById('nombre_li').value,
                editorial_li: document.getElementById('editorial_li').value,
                ISBN_li: document.getElementById('ISBN_li').value,
                // Nota: Convertimos a número el año para que Prisma no marque error
                ano_li: parseInt(document.getElementById('ano_li').value) || null,
                serie_li: document.getElementById('serie_li').value,
                idioma_li: document.getElementById('idioma_li').value,
                url_imagen_li: document.getElementById('url_imagen_li').value,
                estado_fis: document.getElementById('estado_fis').value,
                estante_libro_fis: document.getElementById('estante_libro_fis').value
            };

            if (!datosLibro.nombre_li) {
                alert("El título del libro es obligatorio.");
                return;
            }

            try {
                const respuesta = await Auth.peticionSegura('/api/libros', {
                    method: 'POST',
                    body: JSON.stringify(datosLibro)
                });

                const json = await respuesta.json();

                if (respuesta.ok) {
                    alert(json.mensaje); 
                    // Si tienes el reporte cargado, podrías recargarlo aquí para ver el nuevo libro
                    if (rolActual === 'admin') cargarReporteInventario();
                } else {
                    alert("Error: " + json.error);
                }
            } catch (error) {
                console.error("Error en la petición", error);
                alert("Error al conectar con el servidor.");
            }
        });
    }
});

// ==========================================
// FUNCIONES EXTRA (COMPARTIDAS)
// ==========================================

/**
 * Función de tu colaborador para eliminar un libro
 */
async function eliminarLibro(idLibro) {
    if(confirm('¿Estás seguro de que deseas eliminar este libro del inventario?')) {
        const respuesta = await Auth.peticionSegura(`/api/libros/${idLibro}`, {
            method: 'DELETE'
        });
        const json = await respuesta.json();
        
        if(respuesta.ok) {
            alert(json.mensaje);
            location.reload();
        } else {
            alert("Error: " + json.error);
        }
    }
}

/**
 * Tu nueva función para cargar el reporte del inventario
 */
async function cargarReporteInventario() {
    try {
        const respuesta = await Auth.peticionSegura('/api/reportes/inventario', {
            method: 'GET'
        });

        if (!respuesta || !respuesta.ok) {
            console.error("No se pudo obtener el reporte de inventario.");
            return;
        }

        const datosReporte = await respuesta.json();

        console.log("=== REPORTE DE INVENTARIO OBTENIDO CON ÉXITO ===");
        console.log("Libros en el sistema:", datosReporte.libros);
        console.log("Resumen de estados físicos:", datosReporte.resumenEstados);
        
    } catch (error) {
        console.error("Error de red al cargar el inventario:", error);
    }
}