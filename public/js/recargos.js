document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.verificarPaginaPrivada(['admin', 'bibliotecario'])) return;
    cargarRecargos();
});

async function cargarRecargos() {
    const tbody = document.getElementById('tabla-recargos');
    
    const respuesta = await Auth.peticionSegura('/api/recargos', { method: 'GET' });

    if (!respuesta || !respuesta.ok) {
        tbody.innerHTML = '<tr><td colspan="8" class="py-6 text-center text-error">Error al cargar los recargos.</td></tr>';
        return;
    }

    const recargos = await respuesta.json();

    if (recargos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="py-6 text-center text-secondary">No hay recargos registrados en el sistema.</td></tr>';
        return;
    }

    let totalDeuda = 0;
    const usuariosUnicosEnMora = new Set();
    let html = '';

    recargos.forEach(rec => {
        // Variables de datos
        const prestamoId = rec.prestamo ? `PR-${rec.prestamo.id_prestamo}` : 'N/A';
        const usuarioNombre = rec.prestamo?.usuario?.nombre_usu || 'Desconocido';
        const monto = parseFloat(rec.monto_rec).toFixed(2);
        const estadoUpper = rec.estado_pago_rec.toUpperCase();
        
        let fechaPago = '-';
        if (rec.fecha_pago_rec) {
            fechaPago = new Date(rec.fecha_pago_rec).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        // Cálculos estadísticos (solo sumamos lo que NO está terminado)
        if (estadoUpper !== 'PAGADO' && estadoUpper !== 'CONDONADO') {
            totalDeuda += parseFloat(rec.monto_rec);
            if (rec.prestamo?.usuario?.matricula_usu) {
                usuariosUnicosEnMora.add(rec.prestamo.usuario.matricula_usu);
            }
        }

        // Estilos dinámicos
        let badgeStyle = '';
        let rowStyle = 'hover:bg-surface-container-low transition-colors';

        if (estadoUpper === 'PAGADO') {
            badgeStyle = 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]';
        } else if (estadoUpper === 'CONDONADO') {
            badgeStyle = 'bg-gray-100 text-gray-800 border-gray-200';
        } else if (estadoUpper === 'MORA GRAVE' || estadoUpper === 'MORA') {
            badgeStyle = 'bg-error-container text-on-error-container border-error';
            rowStyle += ' bg-error-container/10'; // Fila con fondo rojizo
        } else {
            // Pendiente
            badgeStyle = 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]';
        }

        // 👇 El botón ahora SIEMPRE abre el modal y pasa los datos correctamente
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

    // Inyectar a la tabla
    tbody.innerHTML = html;

    // Actualizar Estadísticas Top
    document.getElementById('stat-monto-total').textContent = `$${totalDeuda.toFixed(2)}`;
    document.getElementById('stat-usuarios-mora').textContent = usuariosUnicosEnMora.size;
}

// ==========================================
// ABRIR MODAL CON DATOS PRECARGADOS
// ==========================================
window.abrirModalRecargo = (id, usuario, monto, estado) => {
    // 1. Llenamos los campos visuales
    document.getElementById('edit-recargo-id').value = id;
    document.getElementById('edit-recargo-display').value = `#REC-${id}`;
    document.getElementById('edit-recargo-usuario').value = usuario;
    document.getElementById('edit-recargo-monto').value = `$${monto}`;
    
    // 2. Seleccionamos el estado correcto en el dropdown
    const select = document.getElementById('edit-recargo-estado');
    let estadoEncontrado = false;
    
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.toLowerCase() === estado.toLowerCase()) {
            select.selectedIndex = i;
            estadoEncontrado = true;
            break;
        }
    }
    
    if (!estadoEncontrado) select.value = 'Pendiente'; // Valor por defecto

    // 3. Mostramos el modal
    document.getElementById('modal-recargo').classList.remove('hidden');
};

// ==========================================
// PROCESAR FORMULARIO DEL MODAL (PUT)
// ==========================================
document.getElementById('form-recargo').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const idRecargo = document.getElementById('edit-recargo-id').value;
    const nuevoEstado = document.getElementById('edit-recargo-estado').value;

    // Hacemos la petición PUT al controlador genérico
    const respuesta = await Auth.peticionSegura(`/api/recargos/${idRecargo}`, {
        method: 'PUT',
        body: JSON.stringify({ estado_pago_rec: nuevoEstado })
    });

    if (!respuesta) return;
    const resultado = await respuesta.json();

    if (respuesta.ok) {
        UI.toast(resultado.mensaje, 'exito');
        document.getElementById('modal-recargo').classList.add('hidden');
        cargarRecargos(); // Recargamos la tabla para ver los cambios actualizados
    } else {
        UI.toast(resultado.error || 'Error al actualizar el recargo', 'error');
    }
});