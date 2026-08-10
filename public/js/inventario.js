// Archivo: public/js/inventario.js

let listaTodosLosLibros = []; 
let autoresArray = []; // Arreglo global temporal para guardar autores

document.addEventListener('DOMContentLoaded', () => {
    const rolActual = Auth.getRol();
    console.log("Rol actual del usuario:", rolActual);
    
    // Carga de datos iniciales
    cargarReporteInventario();
    cargarLibrosRecientes();

    // ==========================================
    // 1. MANEJO DE VISTA DE AUTORES (BADGES)
    // ==========================================
    const btnAddAutor = document.getElementById('btn-add-autor');
    const inputNombreAu = document.getElementById('nombre_autor_input');
    const inputApellidoAu = document.getElementById('apellido_autor_input');
    const listaAutoresBadges = document.getElementById('lista-autores-badges');

    if (btnAddAutor) {
        btnAddAutor.addEventListener('click', () => {
            const nombre = inputNombreAu.value.trim();
            const apellido = inputApellidoAu.value.trim();

            if (!nombre || !apellido) {
                alert("Por favor, ingresa tanto el nombre como el apellido del autor.");
                return;
            }

            autoresArray.push({ nombre_au: nombre, apellido_au: apellido });
            renderizarAutores();
            
            inputNombreAu.value = '';
            inputApellidoAu.value = '';
            inputNombreAu.focus();
        });
    }

    // Permite al HTML global borrar un autor si te equivocas
    window.eliminarAutor = function(index) {
        autoresArray.splice(index, 1);
        renderizarAutores();
    }

    // Dibuja las "etiquetas" de los autores agregados
    function renderizarAutores() {
        if(!listaAutoresBadges) return;
        listaAutoresBadges.innerHTML = '';
        autoresArray.forEach((autor, index) => {
            const badge = document.createElement('span');
            badge.className = "inline-flex items-center gap-1 px-3 py-1 bg-surface-variant text-on-surface-variant text-sm rounded-full border border-outline-variant/50";
            badge.innerHTML = `
                ${autor.nombre_au} ${autor.apellido_au} 
                <button type="button" onclick="eliminarAutor(${index})" class="text-error hover:text-red-700 font-bold ml-1 rounded-full p-0.5 hover:bg-error/10 transition-colors"><span class="material-symbols-outlined text-[14px]">close</span></button>
            `;
            listaAutoresBadges.appendChild(badge);
        });
    }

    // ==========================================
    // 2. LÓGICA ÚNICA PARA GUARDAR NUEVO LIBRO (CON AUTORES)
    // ==========================================
    const btnGuardar = document.getElementById('btn-guardar');
    const btnActualizar = document.getElementById('btn-actualizar-estado');

    if (rolActual !== 'admin') {
        if (btnGuardar) btnGuardar.style.display = 'none'; 
        if (btnActualizar) btnActualizar.style.display = 'none';
    }

    if (btnGuardar && rolActual === 'admin') {
        btnGuardar.addEventListener('click', async () => {
            const datosLibro = {
                id_categoria: document.getElementById('id_categoria').value,
                nombre_li: document.getElementById('nombre_li').value,
                editorial_li: document.getElementById('editorial_li').value,
                ISBN_li: document.getElementById('ISBN_li').value.trim(),
                ano_li: parseInt(document.getElementById('ano_li').value) || null,
                serie_li: document.getElementById('serie_li').value,
                idioma_li: document.getElementById('idioma_li').value,
                url_imagen_li: document.getElementById('url_imagen_li').value,
                ejemplares: [],
                autores: autoresArray // <- AQUÍ ENVIAMOS EL ARREGLO DE AUTORES AL BACKEND
            };

            if (!datosLibro.nombre_li || !datosLibro.ISBN_li) {
                alert("El título y el ISBN son obligatorios.");
                return;
            }
            if (autoresArray.length === 0) {
                alert("Debes agregar al menos un autor al libro antes de guardar.");
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
                    location.reload();
                } else {
                    alert("❌ Error: " + json.error);
                }
            } catch (error) {
                console.error("Error en la petición", error);
                alert("❌ Error al conectar con el servidor.");
            }
        });
    }

    // ==========================================
    // 3. ACTUALIZAR ESTADO FÍSICO Y ESTANTE
    // ==========================================
    if (btnActualizar && rolActual === 'admin') {
        btnActualizar.addEventListener('click', async () => {
            const inputIsbn = document.getElementById('isbn_ejemplar_editar');
            const selectEstado = document.getElementById('estado_fis_editar');
            const inputEstante = document.getElementById('estante_ejemplar_editar');

            const isbn = inputIsbn ? inputIsbn.value.trim() : '';
            const estadoFis = selectEstado ? selectEstado.value : ''; 
            const estanteFis = inputEstante ? inputEstante.value.trim() : ''; 

            if (!isbn || !estadoFis) {
                alert("Por favor, ingresa el ISBN y selecciona el nuevo Estado Físico.");
                return;
            }

            const mensajeEstante = estanteFis ? ` y ubicación a "${estanteFis}"` : '';
            const confirmar = confirm(`¿Estás seguro de que deseas actualizar el estado físico a "${estadoFis}"${mensajeEstante} para el libro con ISBN ${isbn}?`);
            
            if (!confirmar) return;

            try {
                const respuesta = await Auth.peticionSegura('/api/libros/ejemplares/actualizar-estado', {
                    method: 'PUT',
                    body: JSON.stringify({
                        ISBN_li: isbn,
                        estado_fis: estadoFis,
                        estante_libro_fis: estanteFis
                    })
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    alert(data.mensaje || `¡Éxito! El estado del libro fue actualizado correctamente.`);
                    if (inputIsbn) inputIsbn.value = '';
                    if (inputEstante) inputEstante.value = '';
                    location.reload();
                } else {
                    alert("Error al actualizar: " + (data.error || data.message));
                }
            } catch (error) {
                console.error("Error en la petición:", error);
                alert("Ocurrió un error al intentar comunicarse con el servidor.");
            }
        });
    }

    // ==========================================
    // 4. LÓGICA DE MODAL Y FILTRADO POR SUBMENÚ
    // ==========================================
    const btnVerCatalogo = document.getElementById('btn-ver-catalogo');
    const modalCatalogo = document.getElementById('modal-catalogo');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const inputFiltroModal = document.getElementById('input-filtro-modal');
    const selectCriterioModal = document.getElementById('select-criterio-modal');

    if (btnVerCatalogo && modalCatalogo) {
        btnVerCatalogo.addEventListener('click', () => {
            modalCatalogo.classList.remove('hidden');
            renderizarTablaModal(listaTodosLosLibros);
        });
    }

    if (btnCerrarModal && modalCatalogo) {
        btnCerrarModal.addEventListener('click', () => {
            modalCatalogo.classList.add('hidden');
        });
    }

    if (inputFiltroModal) inputFiltroModal.addEventListener('input', aplicarFiltroModal);
    if (selectCriterioModal) selectCriterioModal.addEventListener('change', aplicarFiltroModal);
});

// ==========================================
// FUNCIONES AUXILIARES GLOBALES
// ==========================================
async function cargarLibrosRecientes() {
    try {
        const respuesta = await Auth.peticionSegura('/api/libros/buscar', { method: 'GET' });
        if (!respuesta || !respuesta.ok) return;

        listaTodosLosLibros = await respuesta.json();
        const contenedor = document.getElementById('contenedor-recientes');
        if (!contenedor) return;

        contenedor.innerHTML = ''; 

        const recientes = listaTodosLosLibros.slice(0, 4);

        if (recientes.length === 0) {
            contenedor.innerHTML = '<p class="p-4 text-sm text-on-surface-variant">No hay libros registrados aún.</p>';
            return;
        }

        recientes.forEach(libro => {
            const div = document.createElement('div');
            div.className = 'p-4 border-b border-outline-variant/50 hover:bg-surface-container-lowest transition-colors flex gap-3 items-start';
            
            const imagenHTML = libro.url_imagen_li 
                ? `<div class="w-12 h-18 bg-cover bg-center rounded shadow-sm shrink-0" style="background-image: url('${libro.url_imagen_li}')"></div>`
                : `<div class="w-12 h-18 bg-surface-container flex items-center justify-center rounded shadow-sm shrink-0 text-outline-variant"><span class="material-symbols-outlined">menu_book</span></div>`;

            const categoriaNombre = libro.categoria ? libro.categoria.nombre_cat : `CAT-${libro.id_categoria}`;

            div.innerHTML = `
                ${imagenHTML}
                <div>
                    <h4 class="font-label-md text-label-md text-on-surface font-semibold line-clamp-2">${libro.nombre_li}</h4>
                    <p class="font-body-md text-[12px] text-on-surface-variant mt-1">${libro.editorial_li || 'Sin Editorial'} • ${libro.ano_li || 'S/A'}</p>
                    <span class="inline-block mt-2 px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] rounded font-medium">${categoriaNombre}</span>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (error) {
        console.error("Error al cargar libros recientes:", error);
    }
}

function aplicarFiltroModal() {
    const inputFiltro = document.getElementById('input-filtro-modal');
    const selectCriterio = document.getElementById('select-criterio-modal');
    if (!inputFiltro) return;

    const termino = inputFiltro.value.trim().toLowerCase();
    const criterio = selectCriterio ? selectCriterio.value : 'todos';

    if (!termino) {
        renderizarTablaModal(listaTodosLosLibros);
        return;
    }

    const filtrados = listaTodosLosLibros.filter(l => {
        const isbnText = l.ISBN_li ? l.ISBN_li.toLowerCase() : '';
        const tituloText = l.nombre_li ? l.nombre_li.toLowerCase() : '';
        const editorialText = l.editorial_li ? l.editorial_li.toLowerCase() : '';
        const categoriaText = (l.categoria && l.categoria.nombre_cat) ? l.categoria.nombre_cat.toLowerCase() : `cat-${l.id_categoria}`;

        switch (criterio) {
            case 'isbn': return isbnText.includes(termino);
            case 'titulo': return tituloText.includes(termino);
            case 'editorial': return editorialText.includes(termino);
            case 'categoria': return categoriaText.includes(termino);
            case 'todos':
            default:
                return isbnText.includes(termino) || tituloText.includes(termino) || editorialText.includes(termino) || categoriaText.includes(termino);
        }
    });
    renderizarTablaModal(filtrados);
}

function renderizarTablaModal(libros) {
    const tbody = document.getElementById('tabla-catalogo-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (libros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-on-surface-variant">No se encontraron libros.</td></tr>';
        return;
    }
    libros.forEach(libro => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-surface-container-lowest transition-colors';
        tr.innerHTML = `
            <td class="p-3 font-mono text-xs font-semibold text-primary">${libro.ISBN_li || 'Sin ISBN'}</td>
            <td class="p-3 font-medium text-on-surface">${libro.nombre_li}</td>
            <td class="p-3 text-on-surface-variant">${libro.editorial_li || '-'}</td>
            <td class="p-3"><span class="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[11px] rounded">${libro.categoria ? libro.categoria.nombre_cat : 'CAT-' + libro.id_categoria}</span></td>
            <td class="p-3 text-on-surface-variant">${libro.ano_li || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function cargarReporteInventario() {
    try {
        const respuesta = await Auth.peticionSegura('/api/reportes/inventario', { method: 'GET' });
        if (!respuesta || !respuesta.ok) return;
        const datosReporte = await respuesta.json();
        console.log("=== REPORTE DE INVENTARIO === ", datosReporte);
    } catch (error) {}
}