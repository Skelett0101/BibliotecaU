document.addEventListener('DOMContentLoaded', () => {
    // 1. Proteger la vista
    if (!Auth.verificarPaginaPrivada()) return;

    cargarMisPrestamos();
});

// ==========================================
// OBTENER HISTORIAL DE PRÉSTAMOS (GET)
// ==========================================
async function cargarMisPrestamos() {
    const contenedor = document.getElementById('contenedor-mis-prestamos');
    const textoPaginacion = document.getElementById('texto-paginacion');
    
    contenedor.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-secondary">Cargando tu historial...</td></tr>';

    const respuesta = await Auth.peticionSegura('/api/prestamos/mis-prestamos', {
        method: 'GET'
    });

    if (!respuesta || !respuesta.ok) {
        contenedor.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-error">Error al cargar el historial.</td></tr>';
        return;
    }

    const prestamos = await respuesta.json();

   // ... código anterior donde recibimos prestamos = await respuesta.json()

    if (prestamos.length === 0) {
        contenedor.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-secondary">No tienes préstamos registrados.</td></tr>';
        if(textoPaginacion) textoPaginacion.textContent = "0 registros";
        return;
    }

    if(textoPaginacion) textoPaginacion.textContent = `Mostrando ${prestamos.length} registros`;

    // ==========================================
    // 🧮 CÁLCULO DINÁMICO DE ESTADÍSTICAS
    // ==========================================
    let totalActivos = 0;
    let totalMora = 0;

    prestamos.forEach(prestamo => {
        const estadoUpper = prestamo.estado_pre.toUpperCase();
        // Contamos como activos a todos los que NO hayan sido devueltos
        if (estadoUpper !== 'DEVUELTO') {
            totalActivos++;
        }
        // Contamos como mora si la palabra incluye "MORA"
        if (estadoUpper.includes('MORA')) {
            totalMora++;
        }
    });

    // Actualizamos el HTML de las tarjetas
    const statTotal = document.getElementById('stat-total');
    const statActivos = document.getElementById('stat-activos');
    const statMora = document.getElementById('stat-mora');

    if (statTotal) statTotal.textContent = prestamos.length;
    if (statActivos) statActivos.textContent = totalActivos;
    if (statMora) statMora.textContent = totalMora;
    // ==========================================

    // Dibujar la tabla
    let html = '';
    prestamos.forEach(prestamo => {
        // Datos del libro
        const libro = prestamo.detalles[0]?.ejemplar?.libro;
        const nombreLibro = libro?.nombre_li || 'Libro sin título';
        const urlImagen = libro?.url_imagen_li || 'https://via.placeholder.com/150'; // Imagen por defecto
        
        // Formateo de fechas
        const fechaInicio = new Date(prestamo.fecha_inicio_pre).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const fechaFin = new Date(prestamo.fecha_fin_pre).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

        // Determinar colores y estilos según el estado
        let colorEstado = 'bg-gray-100 text-gray-800 border-gray-200';
        const estadoUpper = prestamo.estado_pre.toUpperCase();
        
        if (estadoUpper === 'DEVUELTO') {
            colorEstado = 'bg-green-100 text-green-800 border-green-200';
        } else if (estadoUpper === 'PENDIENTE') {
            colorEstado = 'bg-amber-100 text-amber-800 border-amber-200';
        } else if (estadoUpper === 'EN MORA' || estadoUpper === 'MORA') {
            colorEstado = 'bg-red-100 text-red-800 border-red-200';
        } else if (estadoUpper === 'RENOVADO') {
            colorEstado = 'bg-blue-100 text-blue-800 border-blue-200';
        }

        const esMora = estadoUpper.includes('MORA');

        html += `
            <tr class="hover:bg-surface-container-lowest transition-colors group">
                <td class="py-4 px-6 text-secondary font-mono text-sm">${prestamo.no_folio_pre || `#PR-${prestamo.id_prestamo}`}</td>
                <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-14 bg-surface-variant rounded border border-outline-variant/20 flex-shrink-0 bg-cover bg-center"
                             style="background-image: url('${urlImagen}')">
                        </div>
                        <div>
                            <p class="font-headline-md text-[16px] text-on-surface font-bold leading-tight line-clamp-1">${nombreLibro}</p>
                            <p class="font-body-md text-[14px] text-secondary">Ejemplar</p>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6 text-on-surface">${fechaInicio}</td>
                <td class="py-4 px-6 ${esMora ? 'font-bold text-error' : 'text-on-surface'}">${fechaFin}</td>
                <td class="py-4 px-6">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorEstado}">
                        ${estadoUpper}
                    </span>
                </td>
                <td class="py-4 px-6 text-right">
                    ${(estadoUpper === 'PENDIENTE' || estadoUpper === 'MORA') ? `
                        <button onclick="renovarPrestamo(${prestamo.id_prestamo})" class="text-primary hover:text-primary-fixed-dim bg-primary-container/10 hover:bg-primary-container/20 px-3 py-1.5 rounded-lg text-sm font-label-md transition-colors inline-flex items-center gap-1">
                            <span class="material-symbols-outlined text-[18px]">update</span> Renovar
                        </button>
                    ` : `
                        <span class="text-sm text-secondary italic mr-2">${estadoUpper === 'DEVUELTO' ? 'Finalizado' : 'Ya renovado'}</span>
                    `}
                </td>
            </tr>
        `;
    });

    contenedor.innerHTML = html;
}

// ==========================================
// RENOVAR PRÉSTAMO (PUT)
// ==========================================
window.renovarPrestamo = async (idPrestamo) => {
    // Usamos el módulo UI para preguntar antes de renovar
    // (Opcional: Si no tienes UI.confirm, puedes usar confirm nativo)
    const seguro = confirm("¿Deseas solicitar una extensión de 5 días para este préstamo?");
    if (!seguro) return;

    const respuesta = await Auth.peticionSegura(`/api/prestamos/renovar/${idPrestamo}`, {
        method: 'PUT'
    });

    if (!respuesta) return;

    const resultado = await respuesta.json();

    if (respuesta.ok) {
        if (typeof UI !== 'undefined' && UI.toast) UI.toast(resultado.mensaje, 'exito');
        else alert(resultado.mensaje);
        
        cargarMisPrestamos(); 
    } else {
        if (typeof UI !== 'undefined' && UI.toast) UI.toast(resultado.error || 'No se pudo renovar', 'error');
        else alert(resultado.error);
    }
};