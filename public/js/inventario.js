let listaTodosLosLibros = []; 
let autoresArray = []; 

document.addEventListener('DOMContentLoaded', () => {
    const rolActual = Auth.getRol();
    const tienePermisosEdicion = (rolActual === 'admin' || rolActual === 'bibliotecario');
    
    if (rolActual === 'admin') {
        cargarReporteInventario();
    }
    
    cargarLibrosRecientes();
    cargarCategoriasBD();
    cargarAutoresBD();

    if (!tienePermisosEdicion) {
        const botonesOcultar = [
            'btn-guardar', 'btn-actualizar-estado', 'btn-abrir-editar', 
            'btn-nueva-categoria', 'btn-abrir-editar-cat', 
            'btn-nuevo-autor-bd', 'btn-abrir-editar-autor', 'btn-add-autor'
        ];
        botonesOcultar.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'none';
        });
    }

    // ==========================================
    // MODAL: EDITAR CATEGORÍA DESDE EL MENÚ
    // ==========================================
    const modalEditarCat = document.getElementById('modal-editar-cat');
    const btnAbrirEditarCat = document.getElementById('btn-abrir-editar-cat');
    const btnCerrarEditCat = document.getElementById('btn-cerrar-edit-cat');
    const btnGuardarEditCat = document.getElementById('btn-guardar-edit-cat');

    if (btnAbrirEditarCat && tienePermisosEdicion) {
        btnAbrirEditarCat.addEventListener('click', () => {
            const selectPrincipalCat = document.getElementById('id_categoria');
            const idSeleccionado = selectPrincipalCat.value;
            
            if(!idSeleccionado) {
                UI.toast("⚠️ Selecciona una categoría de la lista primero.", "error");
                return;
            }

            const nombreSeleccionado = selectPrincipalCat.options[selectPrincipalCat.selectedIndex].text;
            document.getElementById('input-edit-cat-id').value = idSeleccionado;
            document.getElementById('input-edit-cat-nom').value = nombreSeleccionado;
            modalEditarCat.classList.remove('hidden');
        });

        btnCerrarEditCat.addEventListener('click', () => modalEditarCat.classList.add('hidden'));

        btnGuardarEditCat.addEventListener('click', async () => {
            const id = document.getElementById('input-edit-cat-id').value;
            const nuevoNombre = document.getElementById('input-edit-cat-nom').value.trim();

            if (!nuevoNombre) { UI.toast("El nombre no puede estar vacío.", "error"); return; }

            try {
                const res = await Auth.peticionSegura(`/api/libros/categorias/${id}`, {
                    method: 'PUT', body: JSON.stringify({ nombre_cat: nuevoNombre })
                });
                const data = await res.json();
                
                if (res.ok) {
                    await UI.alert("¡Éxito!", data.mensaje, "exito");
                    modalEditarCat.classList.add('hidden');
                    cargarCategoriasBD(); 
                } else { await UI.alert("Error", data.error, "error"); }
            } catch (error) { UI.toast("Error al conectar con el servidor.", "error"); }
        });
    }

    // ==========================================
    // MODAL: CREAR CATEGORÍA
    // ==========================================
    const modalCat = document.getElementById('modal-categoria');
    const btnNuevaCat = document.getElementById('btn-nueva-categoria');
    const btnCerrarCat = document.getElementById('btn-cerrar-cat');
    const btnGuardarCat = document.getElementById('btn-guardar-cat');

    if (btnNuevaCat && tienePermisosEdicion) {
        btnNuevaCat.addEventListener('click', () => {
            document.getElementById('input-nueva-cat').value = '';
            modalCat.classList.remove('hidden');
        });
        
        btnCerrarCat.addEventListener('click', () => modalCat.classList.add('hidden'));

        btnGuardarCat.addEventListener('click', async () => {
            const nuevaCat = document.getElementById('input-nueva-cat').value.trim();
            if (!nuevaCat) { UI.toast("El nombre no puede estar vacío.", "error"); return; }

            try {
                const res = await Auth.peticionSegura('/api/libros/categorias', {
                    method: 'POST', body: JSON.stringify({ nombre_cat: nuevaCat })
                });
                const data = await res.json();
                if (res.ok) {
                    await UI.alert("¡Éxito!", data.mensaje, "exito");
                    modalCat.classList.add('hidden');
                    cargarCategoriasBD(); 
                } else { await UI.alert("Error", data.error, "error"); }
            } catch (error) { UI.toast("Error de conexión al guardar categoría.", "error"); }
        });
    }

    // ==========================================
    // MODAL: CREAR AUTOR EN BD
    // ==========================================
    const modalAutor = document.getElementById('modal-autor');
    const btnNuevoAutorBD = document.getElementById('btn-nuevo-autor-bd');
    const btnCerrarAutor = document.getElementById('btn-cerrar-autor');
    const btnGuardarAutor = document.getElementById('btn-guardar-autor');

    if (btnNuevoAutorBD && tienePermisosEdicion) {
        btnNuevoAutorBD.addEventListener('click', () => {
            document.getElementById('input-nuevo-autor-nom').value = '';
            document.getElementById('input-nuevo-autor-ape').value = '';
            modalAutor.classList.remove('hidden');
        });

        btnCerrarAutor.addEventListener('click', () => modalAutor.classList.add('hidden'));

        btnGuardarAutor.addEventListener('click', async () => {
            const nombre = document.getElementById('input-nuevo-autor-nom').value.trim();
            const apellido = document.getElementById('input-nuevo-autor-ape').value.trim();
            
            if (!nombre || !apellido) { UI.toast("Nombre y apellido son obligatorios.", "error"); return; }

            try {
                const res = await Auth.peticionSegura('/api/libros/autores', {
                    method: 'POST', body: JSON.stringify({ nombre_au: nombre, apellido_au: apellido })
                });
                const data = await res.json();
                if (res.ok) {
                    await UI.alert("¡Éxito!", data.mensaje, "exito");
                    modalAutor.classList.add('hidden');
                    cargarAutoresBD(); 
                } else { await UI.alert("Error", (data.error || "No se pudo guardar"), "error"); }
            } catch (error) { UI.toast("Error de conexión al guardar autor.", "error"); }
        });
    }

    // ==========================================
    // MODAL: EDITAR AUTOR DESDE EL MENÚ
    // ==========================================
    const modalEditarAutor = document.getElementById('modal-editar-autor');
    const btnAbrirEditarAutor = document.getElementById('btn-abrir-editar-autor');
    const btnCerrarEditAutor = document.getElementById('btn-cerrar-edit-autor');
    const btnGuardarEditAutor = document.getElementById('btn-guardar-edit-autor');

    if (btnAbrirEditarAutor && tienePermisosEdicion) {
        btnAbrirEditarAutor.addEventListener('click', () => {
            const selectAutorBD = document.getElementById('select-autor-bd');
            const valorSeleccionado = selectAutorBD.value;
            
            if(!valorSeleccionado) {
                UI.toast("⚠️ Selecciona un autor del menú desplegable primero.", "error");
                return;
            }

            const autorObj = JSON.parse(valorSeleccionado);
            document.getElementById('input-edit-autor-nom').value = autorObj.nombre;
            document.getElementById('input-edit-autor-ape').value = autorObj.apellido;
            document.getElementById('input-edit-autor-id').value = autorObj.id; 
            modalEditarAutor.classList.remove('hidden');
        });

        btnCerrarEditAutor.addEventListener('click', () => modalEditarAutor.classList.add('hidden'));

        btnGuardarEditAutor.addEventListener('click', async () => {
            const id = document.getElementById('input-edit-autor-id').value;
            const nombre = document.getElementById('input-edit-autor-nom').value.trim();
            const apellido = document.getElementById('input-edit-autor-ape').value.trim();

            if (!nombre || !apellido) { UI.toast("Nombre y apellido no pueden estar vacíos.", "error"); return; }

            try {
                const res = await Auth.peticionSegura(`/api/libros/autores/${id}`, {
                    method: 'PUT', body: JSON.stringify({ nombre_au: nombre, apellido_au: apellido })
                });
                const data = await res.json();
                
                if (res.ok) {
                    await UI.alert("¡Éxito!", data.mensaje, "exito");
                    modalEditarAutor.classList.add('hidden');
                    cargarAutoresBD(); 
                } else { await UI.alert("Error", data.error, "error"); }
            } catch (error) { UI.toast("Error al conectar con el servidor.", "error"); }
        });
    }

    // ==========================================
    // MODAL: EDITAR LIBRO
    // ==========================================
    const modalEditar = document.getElementById('modal-editar');
    const btnAbrirEditar = document.getElementById('btn-abrir-editar');
    const btnCerrarEditar = document.getElementById('btn-cerrar-editar');
    const btnBuscarEditar = document.getElementById('btn-buscar-editar');
    const btnGuardarEdicion = document.getElementById('btn-guardar-edicion');
    const formEditar = document.getElementById('form-editar-campos');

    if (btnAbrirEditar && tienePermisosEdicion) {
        btnAbrirEditar.addEventListener('click', () => {
            document.getElementById('edit-search-isbn').value = '';
            formEditar.classList.add('hidden');
            modalEditar.classList.remove('hidden');
        });

        btnCerrarEditar.addEventListener('click', () => modalEditar.classList.add('hidden'));

        btnBuscarEditar.addEventListener('click', async () => {
            const isbn = document.getElementById('edit-search-isbn').value.trim();
            if(!isbn) return;

            try {
                const res = await Auth.peticionSegura(`/api/libros/buscar?query=${isbn}`, { method: 'GET' });
                const libros = await res.json();
                const libroEdit = libros.find(l => l.ISBN_li === isbn);

                if(libroEdit) {
                    document.getElementById('edit-id-libro').value = libroEdit.id_libro;
                    document.getElementById('edit-titulo').value = libroEdit.nombre_li;
                    document.getElementById('edit-isbn').value = libroEdit.ISBN_li;
                    document.getElementById('edit-categoria').value = libroEdit.id_categoria;
                    document.getElementById('edit-editorial').value = libroEdit.editorial_li;
                    document.getElementById('edit-ano').value = libroEdit.ano_li || '';
                    document.getElementById('edit-idioma').value = libroEdit.idioma_li || '';
                    document.getElementById('edit-serie').value = libroEdit.serie_li || '';
                    document.getElementById('edit-url').value = libroEdit.url_imagen_li || '';
                    formEditar.classList.remove('hidden');
                } else {
                    UI.toast("No se encontró ningún libro con ese ISBN exacto.", "error");
                    formEditar.classList.add('hidden');
                }
            } catch (error) { UI.toast("Error al buscar el libro.", "error"); }
        });

        btnGuardarEdicion.addEventListener('click', async () => {
            const id = document.getElementById('edit-id-libro').value;
            const datosEditados = {
                id_categoria: document.getElementById('edit-categoria').value,
                nombre_li: document.getElementById('edit-titulo').value,
                editorial_li: document.getElementById('edit-editorial').value,
                ISBN_li: document.getElementById('edit-isbn').value,
                ano_li: parseInt(document.getElementById('edit-ano').value) || null,
                serie_li: document.getElementById('edit-serie').value,
                idioma_li: document.getElementById('edit-idioma').value,
                url_imagen_li: document.getElementById('edit-url').value,
            };

            try {
                const res = await Auth.peticionSegura(`/api/libros/${id}`, {
                    method: 'PUT', body: JSON.stringify(datosEditados)
                });
                const data = await res.json();
                if(res.ok) {
                    await UI.alert("¡Éxito!", data.mensaje, "exito");
                    modalEditar.classList.add('hidden');
                    location.reload();
                } else { await UI.alert("Error", data.error, "error"); }
            } catch (error) { UI.toast("Error al actualizar.", "error"); }
        });
    }

    // ==========================================
    // AÑADIR AUTOR A LA LISTA TEMPORAL DEL LIBRO
    // ==========================================
    const btnAddAutor = document.getElementById('btn-add-autor');
    const selectAutorBD = document.getElementById('select-autor-bd');
    const listaAutoresBadges = document.getElementById('lista-autores-badges');

    if (btnAddAutor && selectAutorBD && tienePermisosEdicion) {
        btnAddAutor.addEventListener('click', () => {
            if (!selectAutorBD.value) { UI.toast("Por favor, selecciona un autor de la lista primero.", "error"); return; }
            const autorSeleccionado = JSON.parse(selectAutorBD.value);
            const yaExiste = autoresArray.some(a => a.nombre_au === autorSeleccionado.nombre && a.apellido_au === autorSeleccionado.apellido);
            if (yaExiste) { UI.toast("Este autor ya fue añadido a la lista del libro.", "error"); return; }

            autoresArray.push({ nombre_au: autorSeleccionado.nombre, apellido_au: autorSeleccionado.apellido });
            renderizarAutores();
            selectAutorBD.value = ''; 
        });
    }

    window.eliminarAutor = function(index) {
        autoresArray.splice(index, 1);
        renderizarAutores();
    }

    function renderizarAutores() {
        if (!listaAutoresBadges) return;
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
    // GUARDAR NUEVO LIBRO
    // ==========================================
    const btnGuardar = document.getElementById('btn-guardar');
    if (btnGuardar && tienePermisosEdicion) {
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
                autores: autoresArray 
            };

            if (!datosLibro.id_categoria) { UI.toast("⚠️ Debes seleccionar una Categoría obligatoriamente.", "error"); return; }
            if (!datosLibro.url_imagen_li) { UI.toast("⚠️ La Portada (URL de la imagen) es obligatoria.", "error"); return; }
            if (!datosLibro.nombre_li || !datosLibro.ISBN_li) { UI.toast("El título y el ISBN son obligatorios.", "error"); return; }
            if (autoresArray.length === 0) { UI.toast("Debes añadir al menos un autor al libro.", "error"); return; }

            try {
                const res = await Auth.peticionSegura('/api/libros', { method: 'POST', body: JSON.stringify(datosLibro) });
                const json = await res.json();
                if (res.ok) { 
                    await UI.alert("¡Éxito!", json.mensaje, "exito"); 
                    location.reload(); 
                } else { 
                    await UI.alert("Error", json.error, "error"); 
                }
            } catch (error) { UI.toast("❌ Error al conectar con el servidor.", "error"); }
        });
    }

    // ==========================================
    // ACTUALIZAR ESTADO FÍSICO Y ESTANTE
    // ==========================================
    const btnActualizar = document.getElementById('btn-actualizar-estado');
    if (btnActualizar && tienePermisosEdicion) {
        btnActualizar.addEventListener('click', async () => {
            const inputIsbn = document.getElementById('isbn_ejemplar_editar');
            const selectEstado = document.getElementById('estado_fis_editar');
            const inputEstante = document.getElementById('estante_ejemplar_editar');

            const isbn = inputIsbn ? inputIsbn.value.trim() : '';
            const estadoFis = selectEstado ? selectEstado.value : ''; 
            const estanteFis = inputEstante ? inputEstante.value.trim() : ''; 

            if (!isbn || !estadoFis) { UI.toast("Ingresa el ISBN y selecciona el nuevo Estado.", "error"); return; }

            try {
                const res = await Auth.peticionSegura('/api/libros/ejemplares/actualizar-estado', {
                    method: 'PUT', body: JSON.stringify({ ISBN_li: isbn, estado_fis: estadoFis, estante_libro_fis: estanteFis })
                });
                const data = await res.json();
                if (res.ok) { 
                    await UI.alert("¡Éxito!", data.mensaje || "Estado actualizado correctamente.", "exito"); 
                    location.reload(); 
                } else { 
                    await UI.alert("Error", (data.error || data.message), "error"); 
                }
            } catch (error) { UI.toast("Ocurrió un error al intentar comunicarse con el servidor.", "error"); }
        });
    }

    // ==========================================
    // MODAL Y FILTRADO POR SUBMENÚ
    // ==========================================
    const btnVerCatalogo = document.getElementById('btn-ver-catalogo');
    const modalCatalogo = document.getElementById('modal-catalogo');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const inputFiltroModal = document.getElementById('input-filtro-modal');
    const selectCriterioModal = document.getElementById('select-criterio-modal');

    if (btnVerCatalogo && modalCatalogo) { btnVerCatalogo.addEventListener('click', () => { modalCatalogo.classList.remove('hidden'); renderizarTablaModal(listaTodosLosLibros); }); }
    if (btnCerrarModal && modalCatalogo) { btnCerrarModal.addEventListener('click', () => { modalCatalogo.classList.add('hidden'); }); }
    if (inputFiltroModal) inputFiltroModal.addEventListener('input', aplicarFiltroModal);
    if (selectCriterioModal) selectCriterioModal.addEventListener('change', aplicarFiltroModal);
});

// ==========================================
// FUNCIONES AUXILIARES GLOBALES
// ==========================================

async function cargarCategoriasBD() {
    try {
        const res = await Auth.peticionSegura('/api/libros/categorias', { method: 'GET' });
        if (res.ok) {
            const categorias = await res.json();
            const selectCategoria = document.getElementById('id_categoria');
            const selectEditCategoria = document.getElementById('edit-categoria'); 
            
            if (selectCategoria) selectCategoria.innerHTML = '<option value="">Selecciona una categoría...</option>'; 
            if (selectEditCategoria) selectEditCategoria.innerHTML = '<option value="">Selecciona una categoría...</option>'; 

            categorias.forEach(cat => {
                const option = `<option value="${cat.id_categoria}">${cat.nombre_cat}</option>`;
                if (selectCategoria) selectCategoria.innerHTML += option;
                if (selectEditCategoria) selectEditCategoria.innerHTML += option;
            });
        }
    } catch (error) { console.error("Error al cargar categorías:", error); }
}

async function cargarAutoresBD() {
    try {
        const res = await Auth.peticionSegura('/api/libros/autores', { method: 'GET' });
        if (res.ok) {
            const autores = await res.json();
            const selectAutorBD = document.getElementById('select-autor-bd');
            if (!selectAutorBD) return;
            
            selectAutorBD.innerHTML = '<option value="">Selecciona un autor de la BD...</option>';
            autores.forEach(au => {
                const valorJson = JSON.stringify({ id: au.id_autor, nombre: au.nombre_au, apellido: au.apellido_au });
                selectAutorBD.innerHTML += `<option value='${valorJson}'>${au.nombre_au} ${au.apellido_au}</option>`;
            });
        }
    } catch (error) { console.error("Error al cargar autores:", error); }
}

async function cargarLibrosRecientes() {
    try {
        const res = await Auth.peticionSegura('/api/libros/buscar', { method: 'GET' });
        if (!res || !res.ok) return;

        listaTodosLosLibros = await res.json();
        listaTodosLosLibros.sort((a, b) => b.id_libro - a.id_libro);

        const contenedor = document.getElementById('contenedor-recientes');
        if (!contenedor) return;

        contenedor.innerHTML = ''; 
        const recientes = listaTodosLosLibros.slice(0, 4);

        if (recientes.length === 0) { contenedor.innerHTML = '<p class="p-4 text-sm text-on-surface-variant">No hay libros registrados aún.</p>'; return; }

        recientes.forEach(libro => {
            const div = document.createElement('div');
            div.className = 'p-4 border-b border-outline-variant/50 hover:bg-surface-container-lowest transition-colors flex gap-3 items-start';
            const imagenHTML = libro.url_imagen_li ? `<div class="w-14 h-20 bg-cover bg-center rounded shadow-sm shrink-0" style="background-image: url('${libro.url_imagen_li}')"></div>` : `<div class="w-14 h-20 bg-surface-container flex items-center justify-center rounded shadow-sm shrink-0 text-outline-variant"><span class="material-symbols-outlined">menu_book</span></div>`;
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
    } catch (error) {}
}

function aplicarFiltroModal() {
    const inputFiltro = document.getElementById('input-filtro-modal');
    const selectCriterio = document.getElementById('select-criterio-modal');
    if (!inputFiltro) return;

    const termino = inputFiltro.value.trim().toLowerCase();
    const criterio = selectCriterio ? selectCriterio.value : 'todos';

    if (!termino) { renderizarTablaModal(listaTodosLosLibros); return; }

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
            default: return isbnText.includes(termino) || tituloText.includes(termino) || editorialText.includes(termino) || categoriaText.includes(termino);
        }
    });
    renderizarTablaModal(filtrados);
}

function renderizarTablaModal(libros) {
    const tbody = document.getElementById('tabla-catalogo-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (libros.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-on-surface-variant">No se encontraron libros.</td></tr>'; return; }
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
        const res = await Auth.peticionSegura('/api/reportes/inventario', { method: 'GET' });
    } catch (error) {}
}