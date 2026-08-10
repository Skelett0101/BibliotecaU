document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar la lista de préstamos activos al iniciar la vista
    cargarPrestamosActivos();

    // 2. Escuchar el evento del botón "Autorizar Préstamo"
    const botonAutorizar = document.querySelector('button[type="button"]'); 
    // O puedes asignarle un id="btnAutorizar" en tu HTML al botón y buscarlo por ID.
    if (botonAutorizar) {
        botonAutorizar.addEventListener('click', enviarAutorizacionPrestamo);
    }
});

async function cargarPrestamosActivos() {
    try {
        const respuesta = await Auth.peticionSegura('/api/prestamos');
        if (!respuesta || !respuesta.ok) return;

        const prestamos = await respuesta.json();
        const tbody = document.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = ''; // Limpiar filas estáticas de ejemplo

        if (prestamos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-secondary">No hay préstamos registrados.</td></tr>`;
            return;
        }

        prestamos.forEach(p => {
            const nombreUsuario = p.usuario ? p.usuario.nombre_usu : 'Desconocido';
            const detalleLibro = p.detalles && p.detalles[0] && p.detalles[0].ejemplar 
                ? `${p.detalles[0].ejemplar.id_ejemplar}` 
                : 'N/A';
            
            const fechaVencimiento = new Date(p.fecha_fin_pre).toLocaleDateString();

            let badgeClase = 'bg-green-100 text-green-800';
            let puntoClase = 'bg-green-500';
            if (p.estado_pre === 'PENDIENTE') {
                badgeClase = 'bg-amber-100 text-amber-800';
                puntoClase = 'bg-amber-500';
            } else if (p.estado_pre === 'MORA' || p.estado_pre === 'ATRASADO') {
                badgeClase = 'bg-error-container text-on-error-container';
                puntoClase = 'bg-error';
            }

            const tr = document.createElement('tr');
            tr.className = 'border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors';
            tr.innerHTML = `
                <td class="px-6 py-4 text-secondary">#PR-${p.id_prestamo}</td>
                <td class="px-6 py-4 font-medium text-on-surface">${nombreUsuario}</td>
                <td class="px-6 py-4 text-on-surface-variant">Ejemplar ID: ${detalleLibro}</td>
                <td class="px-6 py-4 text-on-surface-variant">${fechaVencimiento}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${badgeClase} font-label-md text-sm">
                        <span class="w-2 h-2 rounded-full ${puntoClase}"></span> ${p.estado_pre}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <span class="text-xs text-secondary">${p.no_folio_pre || ''}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error cargando préstamos:', error);
    }
}

async function enviarAutorizacionPrestamo() {
    const id_usuario = document.getElementById('id_usuario').value.trim();
    const id_ejemplar = document.getElementById('id_ejemplar').value.trim();
    const fecha_inicio = document.getElementById('fecha_inicio').value;
    const fecha_fin = document.getElementById('fecha_fin').value;

    if (!id_usuario || !id_ejemplar || !fecha_inicio || !fecha_fin) {
        alert('Por favor, completa todos los campos para autorizar el préstamo.');
        return;
    }

    try {
        const respuesta = await Auth.peticionSegura('/api/prestamos/autorizar', {
            method: 'POST',
            body: JSON.stringify({
                id_usuario,
                id_ejemplar,
                fecha_inicio,
                fecha_fin
            })
        });

        if (respuesta && respuesta.ok) {
            alert('¡Préstamo autorizado con éxito!');
            // Limpiar formulario y recargar tabla
            document.getElementById('id_usuario').value = '';
            document.getElementById('id_ejemplar').value = '';
            cargarPrestamosActivos();
        } else {
            const errorData = await respuesta.json();
            alert(`Error: ${errorData.error || 'No se pudo autorizar el préstamo'}`);
        }
    } catch (error) {
        console.error('Error en la petición de autorización:', error);
        alert('Ocurrió un error de conexión al autorizar el préstamo.');
    }
}