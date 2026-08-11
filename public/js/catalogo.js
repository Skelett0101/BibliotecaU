// 1. Manejo del menú de perfil desplegable    TERMINADO
document.addEventListener('click', (e) => {
    const menu = document.getElementById('menu-perfil');
    const btn = document.getElementById('btn-perfil');
    if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// 2. Control de Modal de Préstamo   PENDIENTE A MEDIAS
function abrirModalPrestamo(idLibro, titulo) {
    document.getElementById('prestamo-id-libro').value = idLibro;
    document.getElementById('prestamo-titulo-libro').value = titulo;

    const fechaPredeterminada = new Date();
    fechaPredeterminada.setDate(fechaPredeterminada.getDate() + 7);
    document.getElementById('prestamo-fecha-fin').value = fechaPredeterminada.toISOString().split('T')[0];

    document.getElementById('modal-prestamo').classList.remove('hidden');
}

function cerrarModalPrestamo() {
    document.getElementById('modal-prestamo').classList.add('hidden');
    document.getElementById('form-solicitar-prestamo').reset();
}

// Renderizar Libros en la Cuadrícula       TERMINADO
function renderizarLibros(libros) {
    const contenedor = document.querySelector('.grid');
    if (!contenedor) return;

    if (!libros || libros.length === 0) {
        contenedor.innerHTML = `
            <p class="col-span-full text-center text-on-surface-variant py-8 font-body-md">
                No se encontraron libros disponibles en el catálogo.
            </p>`;
        return;
    }

    contenedor.innerHTML = libros.map(libro => {
        // Un libro está disponible si tiene al menos un ejemplar no desactivado
        const tieneEjemplares = libro.ejemplares && libro.ejemplares.length > 0;
        const disponible = tieneEjemplares && libro.ejemplares.some(e => e.estado_fis !== 'Desactivado');

        // Nombre de la categoría
        const categoriaNombre = libro.categoria?.nombre_cat || libro.editorial_li || 'General';

        // Nombres de autores
        let nombreAutor = 'Autor Desconocido';
        if (libro.autores && libro.autores.length > 0) {
            nombreAutor = libro.autores
                .map(a => `${a.autor?.nombre_au || ''} ${a.autor?.apellido_au || ''}`.trim())
                .filter(Boolean)
                .join(', ');
        } else if (libro.autor_li) {
            nombreAutor = libro.autor_li;
        }

        // Imagen de portada
        const imagenUrl = libro.url_imagen_li || 'https://lh3.googleusercontent.com/aida-public/AB6AXuApuZ5gMbBT0mc6xeqMhEn-YBRYn1eu6KBc0Mivp-M2s7bGiB1Q5jwnWt58uwxd7CnOS_VYWG4l-EB4-y3lLz0IY3H9RdpV56ZFQ444esj80AiWnWX0TpEWKWyVT0TNpHYXVAC4JLYfYsV6FJ5uYcYpAiKmMgqYP9KaXpFtcGpWWNKoRuLZ3oJD_O6e-FK2H7EQ0DMuHT8vYoR4ukokkRFBCYMKq00ztPxDva0fWEeETS1hIEMbyFcGsw';

        return `
        <article class="flex flex-col group relative bg-surface border border-outline-variant/30 rounded-lg p-3 hover:shadow-md transition-shadow duration-300 ${!disponible ? 'opacity-75' : ''}">
            <div class="relative w-full rounded overflow-hidden mb-3">
                <div class="book-cover-ratio"></div>
                <img class="absolute inset-0 w-full h-full object-cover ${!disponible ? 'grayscale' : ''}" 
                     src="${imagenUrl}" 
                     alt="${libro.nombre_li}" />
                <div class="absolute top-2 right-2 w-3 h-3 rounded-full ${disponible ? 'bg-green-500' : 'bg-red-500'} border-2 border-surface shadow-sm"
                     title="${disponible ? 'Disponible' : 'No disponible'}"></div>
            </div>

            <div class="flex-grow flex flex-col">
                <span class="text-[12px] font-label-md text-primary font-medium tracking-wide uppercase mb-1">
                    ${categoriaNombre}
                </span>
                <h3 class="font-headline-md text-[16px] leading-[22px] text-on-background mb-1 line-clamp-2">
                    ${libro.nombre_li}
                </h3>
                <p class="font-body-md text-[14px] text-on-surface-variant mb-4">
                    ${nombreAutor}
                </p>

                ${disponible 
                    ? `<button onclick="abrirModalPrestamo(${libro.id_libro}, '${libro.nombre_li.replace(/'/g, "\\'")}')" 
                               class="mt-auto w-full py-2 bg-primary-container text-on-primary-container font-label-md text-label-md rounded hover:shadow-[0_2px_8px_rgba(159,99,50,0.3)] transition-all">
                           Solicitar Préstamo
                       </button>`
                    : `<button class="mt-auto w-full py-2 bg-surface-variant text-on-surface-variant font-label-md text-label-md rounded cursor-not-allowed" disabled>
                           En Préstamo
                       </button>`
                }
            </div>
        </article>`;
    }).join('');
}


// Función para consultar el Backend        TERMINADO
async function obtenerLibros(query = '') {
    try {
        let libros = [];
        const token = localStorage.getItem('token');
        
        // Cabeceras configuradas por si la ruta requiere Token JWT
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/libros/buscar-alumnos?query=${encodeURIComponent(query)}`, { headers });

        if (!res.ok) {
            throw new Error(`Error ${res.status}: No se pudo obtener el catálogo`);
        }

        libros = await res.json();
        renderizarLibros(libros);
    } catch (error) {
        console.error("Error al obtener libros:", error);
    }
}

// 5. Carga inicial
document.addEventListener('DOMContentLoaded', () => {
    obtenerLibros();
});


// ==========================================
// PASO 2: BUSCADOR EN TIEMPO REAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const inputBuscador = document.getElementById('input-buscador');
    let timerBusqueda;

    if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => {
            clearTimeout(timerBusqueda);
            const termino = e.target.value.trim();

            // Espera 300ms después de que el usuario deja de escribir para consultar la BD
            timerBusqueda = setTimeout(() => {
                obtenerLibros(termino);
            }, 300);
        });
    }
});

//---------------------------solicitud de prestamo---------------------------
// Procesar el formulario del modal de préstamo
const formPrestamo = document.getElementById('form-solicitar-prestamo');

if (formPrestamo) {
    formPrestamo.addEventListener('submit', async (e) => {
        e.preventDefault();

        const idLibro = document.getElementById('prestamo-id-libro').value;
        const fechaFin = document.getElementById('prestamo-fecha-fin').value;

        try {
            const token = localStorage.getItem('token');

            const res = await fetch('/api/prestamos/solicitar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id_libro: idLibro,
                    fecha_fin: fechaFin
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'No se pudo procesar la solicitud');
            }

            cerrarModalPrestamo();

            if (typeof UI !== 'undefined' && UI.toast) {
                UI.toast('Solicitud enviada correctamente', 'exito');
            } else {
                alert('Solicitud enviada correctamente');
            }

            // Recargar catálogo para actualizar estado si aplica
            obtenerLibros();

        } catch (error) {
            console.error('Error al solicitar el préstamo:', error);
            alert(error.message || 'Ocurrió un error al enviar la solicitud.');
        }
    });
}