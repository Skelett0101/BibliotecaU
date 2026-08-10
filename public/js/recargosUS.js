document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.verificarPaginaPrivada()) return;
    cargarMisRecargos();
});

async function cargarMisRecargos() {
    const tbody = document.getElementById('tabla-mis-recargos');
    const textoPaginacion = document.getElementById('texto-paginacion');
    
    const respuesta = await Auth.peticionSegura('/api/recargos/mis-recargos', { method: 'GET' });

    if (!respuesta || !respuesta.ok) {
        tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-error">Error al cargar el historial.</td></tr>';
        return;
    }

    const recargos = await respuesta.json();

    if (recargos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-secondary">No tienes multas ni recargos registrados. ¡Excelente historial!</td></tr>';
        if(textoPaginacion) textoPaginacion.textContent = "0 registros";
        return;
    }

    if(textoPaginacion) textoPaginacion.textContent = `Mostrando ${recargos.length} registros`;

    let deudaTotal = 0;
    let recargosActivos = 0;
    let html = '';

    recargos.forEach(rec => {
        // Datos del libro navegando por el JSON de Prisma
        const libro = rec.prestamo?.detalles?.[0]?.ejemplar?.libro;
        const nombreLibro = libro?.nombre_li || 'Libro sin título';
        const urlImagen = libro?.url_imagen_li || 'https://via.placeholder.com/150';
        
        const prestamoFolio = rec.prestamo?.no_folio_pre || `PR-${rec.id_prestamo}`;
        const monto = parseFloat(rec.monto_rec).toFixed(2);
        const estadoUpper = rec.estado_pago_rec.toUpperCase();
        
        let fechaPago = '-';
        if (rec.fecha_pago_rec) {
            fechaPago = new Date(rec.fecha_pago_rec).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        // Estadísticas y Estilos
        let badgeStyle = '';
        let actionBtn = '';
        let trClass = 'hover:bg-surface-container-low transition-colors group';
        let imgClass = '';
        let montoClass = 'text-right font-medium text-error';
        let isPagado = false;

        if (estadoUpper === 'PAGADO' || estadoUpper === 'CONDONADO') {
            isPagado = true;
            trClass += ' opacity-80';
            imgClass = 'grayscale opacity-80';
            montoClass = 'text-right text-secondary';
            badgeStyle = 'bg-secondary-container/50 text-on-secondary-container border border-secondary-container';
            actionBtn = `
                <button class="text-secondary hover:text-primary border border-transparent hover:border-outline-variant px-3 py-1.5 rounded transition-all flex items-center gap-1 justify-center mx-auto" onclick="UI.toast('Recibo en desarrollo', 'info')">
                    <span class="material-symbols-outlined text-sm">receipt</span>
                </button>`;
        } else {
            // Está activo (Pendiente o Mora)
            deudaTotal += parseFloat(rec.monto_rec);
            recargosActivos++;
            badgeStyle = 'bg-error-container text-on-error-container';
            actionBtn = `
                <button class="bg-[#9F6332] text-white px-4 py-1.5 rounded font-label-md text-sm hover:shadow-md hover:-translate-y-0.5 transition-all" onclick="instruccionesPago()">
                    Pagar Ahora
                </button>`;
        }

        // Construir la fila
        html += `
            <tr class="${trClass}">
                <td class="py-4 px-4 font-medium ${isPagado ? 'text-secondary' : ''}">REC-${rec.id_recargo}</td>
                <td class="py-4 px-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-14 bg-surface-container-high rounded overflow-hidden flex-shrink-0 border border-outline-variant/20 ${imgClass}">
                            <img alt="Portada" class="w-full h-full object-cover" src="${urlImagen}" />
                        </div>
                        <div>
                            <p class="font-medium text-on-surface group-hover:text-primary transition-colors line-clamp-1">${nombreLibro} (${prestamoFolio})</p>
                            <p class="text-sm text-secondary">Retraso: ${rec.dias_retraso_rec} días</p>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-4 ${montoClass}">$${monto}</td>
                <td class="py-4 px-4 text-right ${isPagado ? 'text-secondary' : 'text-error font-medium'}">${rec.dias_retraso_rec} días</td>
                <td class="py-4 px-4 text-center">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-md text-xs ${badgeStyle}">
                        <span class="w-1.5 h-1.5 rounded-full ${isPagado ? 'bg-secondary' : 'bg-error'}"></span>
                        ${estadoUpper}
                    </span>
                </td>
                <td class="py-4 px-4 text-right ${isPagado ? 'text-on-surface' : 'text-secondary italic'}">${fechaPago}</td>
                <td class="py-4 px-4 text-center">${actionBtn}</td>
            </tr>
        `;
    });

    // Inyectar al HTML
    tbody.innerHTML = html;
    
    // Actualizar Estadísticas
    document.getElementById('stat-monto-total').textContent = `$${deudaTotal.toFixed(2)}`;
    document.getElementById('stat-recargos-activos').textContent = recargosActivos;
}

// ==========================================
// INSTRUCCIONES DE PAGO PARA USUARIOS
// ==========================================
window.instruccionesPago = () => {
    // Al ser un estudiante, el pago se hace físicamente (o puedes conectarlo a Stripe si el proyecto lo pide)
    UI.alert(
        "Instrucciones de Pago", 
        "Para liquidar este recargo, por favor acude a la ventanilla de la biblioteca con tu matrícula. El sistema se actualizará una vez que el bibliotecario registre tu pago.",
        "advertencia"
    );
};