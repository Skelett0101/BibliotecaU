document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.verificarPaginaPrivada(['admin', 'bibliotecario'])) return;
    cargarRecargos();
});


// VARIABLES GLOBALES (PAGINACIÓN Y FILTROS)

let todosLosRecargos = [];
let recargosFiltrados = [];
let paginaActual = 1;
const registrosPorPagina = 5; // Puedes cambiar a 10 o 20


// CARGAR DATOS DESDE EL SERVIDOR
async function cargarRecargos() {
    const tbody = document.getElementById('tabla-recargos');
    tbody.innerHTML = '<tr><td colspan="8" class="py-6 text-center text-secondary">Cargando recargos...</td></tr>';
    
    const respuesta = await Auth.peticionSegura('/api/recargos', { method: 'GET' });

    if (!respuesta || !respuesta.ok) {
        tbody.innerHTML = '<tr><td colspan="8" class="py-6 text-center text-error">Error al cargar los recargos.</td></tr>';
        return;
    }

    // Guardamos los datos puros que vienen de la BD
    todosLosRecargos = await respuesta.json();

    // Actualizamos los números de arriba 
    actualizarEstadisticas();

    // Arrancamos el motor de filtros y paginación
    aplicarFiltros();
}


// ACTUALIZAR TARJETAS SUPERIORES

function actualizarEstadisticas() {
    let totalDeuda = 0;
    const usuariosUnicosEnMora = new Set();

    todosLosRecargos.forEach(rec => {
        const estadoUpper = rec.estado_pago_rec.toUpperCase();
        if (estadoUpper !== 'PAGADO' && estadoUpper !== 'CONDONADO') {
            totalDeuda += parseFloat(rec.monto_rec);
            if (rec.prestamo?.usuario?.matricula_usu) {
                usuariosUnicosEnMora.add(rec.prestamo.usuario.matricula_usu);
            }
        }
    });

    document.getElementById('stat-monto-total').textContent = `$${totalDeuda.toFixed(2)}`;
    document.getElementById('stat-usuarios-mora').textContent = usuariosUnicosEnMora.size;
}


// MOTOR DE BÚSQUEDA Y FILTROS

window.aplicarFiltros = () => {
    const busqueda = document.getElementById('input-busqueda').value.toLowerCase();
    const estadoFiltro = document.getElementById('select-estado').value.toLowerCase();

    recargosFiltrados = todosLosRecargos.filter(rec => {
        // Datos a buscar
        const idTexto = `rec-${rec.id_recargo}`;
        const usuarioNombre = (rec.prestamo?.usuario?.nombre_usu || '').toLowerCase();
        const matricula = (rec.prestamo?.usuario?.matricula_usu || '').toLowerCase();
        const estadoReal = rec.estado_pago_rec.toLowerCase();

        // Validar Búsqueda (Texto)
        const pasaBusqueda = idTexto.includes(busqueda) || usuarioNombre.includes(busqueda) || matricula.includes(busqueda);
        
        // Validar Estado (Dropdown)
        let pasaEstado = false;
        if (estadoFiltro === 'todos') {
            pasaEstado = true;
        } else if (estadoFiltro === 'mora') {
            pasaEstado = estadoReal.includes('mora');
        } else {
            pasaEstado = estadoReal === estadoFiltro;
        }

        return pasaBusqueda && pasaEstado;
    });

    // filtro y regresamos a la primera pagina
    paginaActual = 1; 
    renderizarTabla();
};


// DIBUJAR LA TABLA Y LA PAGINACIÓN

function renderizarTabla() {
    const tbody = document.getElementById('tabla-recargos');
    const textoPaginacion = document.getElementById('texto-paginacion');
    const contenedorPaginacion = document.getElementById('contenedor-paginacion');

    if (recargosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="py-6 text-center text-secondary">No se encontraron resultados con estos filtros.</td></tr>';
        textoPaginacion.textContent = "Mostrando 0 registros";
        contenedorPaginacion.innerHTML = '';
        return;
    }

    // logica Matemática de Paginación
    const totalPaginas = Math.ceil(recargosFiltrados.length / registrosPorPagina);
    const indiceInicio = (paginaActual - 1) * registrosPorPagina;
    const indiceFin = indiceInicio + registrosPorPagina;
    
  
    const datosPagina = recargosFiltrados.slice(indiceInicio, indiceFin);

    let html = '';
    datosPagina.forEach(rec => {
        const prestamoId = rec.prestamo ? `PR-${rec.prestamo.id_prestamo}` : 'N/A';
        const usuarioNombre = rec.prestamo?.usuario?.nombre_usu || 'Desconocido';
        const monto = parseFloat(rec.monto_rec).toFixed(2);
        const estadoUpper = rec.estado_pago_rec.toUpperCase();
        
        let fechaPago = '-';
        if (rec.fecha_pago_rec) {
            fechaPago = new Date(rec.fecha_pago_rec).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        let badgeStyle = '';
        let rowStyle = 'hover:bg-surface-container-low transition-colors';

        if (estadoUpper === 'PAGADO') {
            badgeStyle = 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]';
        } else if (estadoUpper === 'CONDONADO') {
            badgeStyle = 'bg-gray-100 text-gray-800 border-gray-200';
        } else if (estadoUpper === 'MORA GRAVE' || estadoUpper === 'MORA') {
            badgeStyle = 'bg-error-container text-on-error-container border-error';
            rowStyle += ' bg-error-container/10';
        } else {
            badgeStyle = 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]';
        }

        let actionBtn = `
            <button class="text-secondary hover:text-primary transition-colors p-1" title="Gestionar Recargo" 
                    onclick="abrirModalRecargo(${rec.id_recargo}, '${usuarioNombre}', '${monto}', '${rec.estado_pago_rec}')">
                <span class="material-symbols-outlined">edit</span>
            </button>
        `;

        html += `
            <tr class="${rowStyle}">
                <td class="py-3 px-4 text-on-surface-variant font-mono text-sm">#REC-${rec.id_recargo}</td>
                <td class="py-3 px-4 text-primary underline cursor-pointer">${prestamoId}</td>
                <td class="py-3 px-4 font-medium ${estadoUpper.includes('MORA') ? 'text-error' : ''}">${usuarioNombre}</td>
                <td class="py-3 px-4 font-bold ${estadoUpper.includes('MORA') ? 'text-error' : ''}">$${monto}</td>
                <td class="py-3 px-4 ${estadoUpper.includes('MORA') ? 'text-error font-medium' : ''}">${rec.dias_retraso_rec}</td>
                <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badgeStyle}">
                        ${estadoUpper}
                    </span>
                </td>
                <td class="py-3 px-4 text-on-surface-variant text-sm">${fechaPago}</td>
                <td class="py-3 px-4 text-right">${actionBtn}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // Actualizar Textos y Botones
    const mostrandoFin = Math.min(indiceFin, recargosFiltrados.length);
    textoPaginacion.textContent = `Mostrando ${indiceInicio + 1} a ${mostrandoFin} de ${recargosFiltrados.length} registros`;
    
    renderizarBotonesPaginacion(totalPaginas);
}

function renderizarBotonesPaginacion(totalPaginas) {
    const contenedor = document.getElementById('contenedor-paginacion');
    let html = '';

    // btn Anterior
    html += `<button onclick="cambiarPagina(${paginaActual - 1})" class="p-1 rounded text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50" ${paginaActual === 1 ? 'disabled' : ''}>
                <span class="material-symbols-outlined text-sm">chevron_left</span>
             </button>`;

    // numeros de Página
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === paginaActual) {
            html += `<button class="w-8 h-8 rounded bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center">${i}</button>`;
        } else {
            html += `<button onclick="cambiarPagina(${i})" class="w-8 h-8 rounded hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center transition-colors">${i}</button>`;
        }
    }

    // btn Siguiente
    html += `<button onclick="cambiarPagina(${paginaActual + 1})" class="p-1 rounded text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50" ${paginaActual === totalPaginas ? 'disabled' : ''}>
                <span class="material-symbols-outlined text-sm">chevron_right</span>
             </button>`;

    contenedor.innerHTML = html;
}

window.cambiarPagina = (nuevaPagina) => {
    const totalPaginas = Math.ceil(recargosFiltrados.length / registrosPorPagina);
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActual = nuevaPagina;
        renderizarTabla(); // Redibujamos la tabla con los datos nuevos
    }
};


// FUNCIONES DEL MODAL (Actualizar y Sincronizar)

window.abrirModalRecargo = (id, usuario, monto, estado) => {
    document.getElementById('edit-recargo-id').value = id;
    document.getElementById('edit-recargo-display').value = `#REC-${id}`;
    document.getElementById('edit-recargo-usuario').value = usuario;
    document.getElementById('edit-recargo-monto').value = `$${monto}`;
    
    const select = document.getElementById('edit-recargo-estado');
    let estadoEncontrado = false;
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.toLowerCase() === estado.toLowerCase()) {
            select.selectedIndex = i;
            estadoEncontrado = true;
            break;
        }
    }
    if (!estadoEncontrado) select.value = 'Pendiente';

    document.getElementById('modal-recargo').classList.remove('hidden');
};

document.getElementById('form-recargo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idRecargo = document.getElementById('edit-recargo-id').value;
    const nuevoEstado = document.getElementById('edit-recargo-estado').value;

    const respuesta = await Auth.peticionSegura(`/api/recargos/${idRecargo}`, {
        method: 'PUT',
        body: JSON.stringify({ estado_pago_rec: nuevoEstado })
    });

    if (!respuesta) return;
    const resultado = await respuesta.json();

    if (respuesta.ok) {
        UI.toast(resultado.mensaje, 'exito');
        document.getElementById('modal-recargo').classList.add('hidden');
        cargarRecargos(); 
    } else {
        UI.toast(resultado.error || 'Error al actualizar el recargo', 'error');
    }
});

window.sincronizarRecargosManual = async () => {
    const btn = document.getElementById('btn-sincronizar');
    const contenidoOriginal = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">refresh</span> Calculando...`;
    btn.disabled = true;

    try {
        const respuesta = await Auth.peticionSegura('/api/recargos/sincronizar', { method: 'POST' });
        if (!respuesta) return;
        const resultado = await respuesta.json();

        if (respuesta.ok) {
            if (typeof UI !== 'undefined' && UI.toast) UI.toast(resultado.mensaje, 'exito');
            else alert(resultado.mensaje);
            cargarRecargos(); 
        } else {
            if (typeof UI !== 'undefined' && UI.toast) UI.toast(resultado.error, 'error');
            else alert(resultado.error);
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        btn.innerHTML = contenidoOriginal;
        btn.disabled = false;
    }
};