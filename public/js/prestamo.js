document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar la lista de préstamos activos al iniciar la vista
    cargarPrestamosActivos();

    // 2. Escuchar el evento del botón "Autorizar Préstamo"
    const botonAutorizar = document.querySelector('button[type="button"]'); 
    if (botonAutorizar) {
        botonAutorizar.addEventListener('click', enviarAutorizacionPrestamo);
    }

    // 3. Escuchar el evento de guardar cambios en el Modal de Edición
    const formEditar = document.getElementById('formEditarPrestamo');
    if (formEditar) {
        formEditar.addEventListener('submit', guardarCambiosPrestamo);
    }
});

async function cargarPrestamosActivos() {
    try {
        const respuesta = await Auth.peticionSegura('/api/prestamos');
        if (!respuesta || !respuesta.ok) return;

        const prestamos = await respuesta.json();
        const tbody = document.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = ''; // Limpiar filas de la tabla

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

            // Configuración de colores para los 4 estados
            let badgeClase = 'bg-gray-100 text-gray-800';
            let puntoClase = 'bg-gray-500';

            switch(p.estado_pre) {
                case 'Pendiente':
                    badgeClase = 'bg-amber-100 text-amber-800';
                    puntoClase = 'bg-amber-500';
                    break;
                case 'Prestado':
                    badgeClase = 'bg-green-100 text-green-800';
                    puntoClase = 'bg-green-500';
                    break;
                case 'Devuelto':
                    badgeClase = 'bg-blue-100 text-blue-800';
                    puntoClase = 'bg-blue-500';
                    break;
                case 'Incidencia':
                    badgeClase = 'bg-red-100 text-red-800';
                    puntoClase = 'bg-red-500';
                    break;
            }

            // Preparar el objeto JSON escapando comillas simples para evitar romper el HTML
            const prestamoJsonStr = JSON.stringify(p).replace(/'/g, "\\'");

            // Botón de acción con ícono de lápiz minimalista
            let accionHtml = `
                <button onclick='abrirModalPrestamo(${prestamoJsonStr})' class="text-secondary hover:text-primary transition-colors ml-auto flex items-center justify-center p-1 rounded-full" title="Gestionar">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
            `;

            // Si está pendiente, agregar también el botón de Activar
            if (p.estado_pre === 'Pendiente') {
                accionHtml = `
                    <div class="flex gap-3 justify-end items-center">
                        <button onclick="autorizarApartado(${p.id_prestamo})" class="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-xs font-label-md transition-colors flex items-center gap-1">
                            <span class="material-symbols-outlined text-[16px]">verified</span> Activar
                        </button>
                        <button onclick='abrirModalPrestamo(${prestamoJsonStr})' class="text-secondary hover:text-primary transition-colors p-1 rounded-full flex items-center justify-center" title="Gestionar">
                            <span class="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                    </div>
                `;
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
                    ${accionHtml}
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

// =========================================
// NUEVAS FUNCIONES PARA EL MODAL DE EDICIÓN
// =========================================

window.abrirModalPrestamo = function(prestamo) {
    document.getElementById('edit_id_prestamo').value = prestamo.id_prestamo;
    
    // Formatear fecha para el input tipo Date
    if (prestamo.fecha_fin_pre) {
        const fechaFormateada = new Date(prestamo.fecha_fin_pre).toISOString().split('T')[0];
        document.getElementById('edit_fecha_fin').value = fechaFormateada;
    }
    
    document.getElementById('edit_estado_pre').value = prestamo.estado_pre;
    
    // Mostrar modal (remover clase hidden y forzar flex)
    const modal = document.getElementById('modalEditarPrestamo');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.cerrarModalPrestamo = function() {
    const modal = document.getElementById('modalEditarPrestamo');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

async function guardarCambiosPrestamo(e) {
    e.preventDefault(); // Evita recargar la página
    
    const id_prestamo = document.getElementById('edit_id_prestamo').value;
    const fecha_fin = document.getElementById('edit_fecha_fin').value;
    const estado_pre = document.getElementById('edit_estado_pre').value;

    try {
        const respuesta = await Auth.peticionSegura(`/api/prestamos/actualizar/${id_prestamo}`, {
            method: 'PUT',
            body: JSON.stringify({ fecha_fin, estado_pre })
        });

        if (respuesta && respuesta.ok) {
            alert('¡Préstamo actualizado exitosamente!');
            cerrarModalPrestamo();
            cargarPrestamosActivos(); // Refrescar la tabla
        } else {
            const err = await respuesta.json();
            alert(`Error: ${err.error || 'No se pudo actualizar el préstamo'}`);
        }
    } catch (error) {
        console.error('Error al actualizar préstamo:', error);
        alert('Error de conexión al actualizar el préstamo.');
    }
}

window.autorizarApartado = async function(id_prestamo) {
    if (!confirm('¿El alumno ha entregado su credencial física? Se procederá a activar el préstamo.')) return;

    try {
        const respuesta = await Auth.peticionSegura('/api/prestamos/autorizar', {
            method: 'POST',
            body: JSON.stringify({ id_prestamo })
        });

        if (respuesta && respuesta.ok) {
            alert('¡Préstamo activado correctamente!');
            cargarPrestamosActivos(); // Refrescar la tabla
        } else {
            const err = await respuesta.json();
            alert(`Error: ${err.error || 'No se pudo activar el préstamo'}`);
        }
    } catch (error) {
        console.error('Error al autorizar apartado:', error);
        alert('Error de conexión al procesar la autorización.');
    }
};